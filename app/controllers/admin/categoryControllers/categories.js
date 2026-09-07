const ObjectId = require('mongoose').Types.ObjectId;
const { revalidateSiteTag } = require('../../../helper/revalidate');

// Every write below ends with this: the website caches the taxonomy, and a category
// nobody can see until the cache expires is indistinguishable from one that failed to
// save. Fire-and-forget - see the helper.
const CATEGORIES_TAG = 'categories';

// The taxonomy every activity is filed under. It starts empty on purpose: the
// categories are set up in the CMS before the first activity is written, so
// nothing is pre-filled here for someone to have to clear out.

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

/** How many activities sit in each category, keyed by slug. */
async function countBySlug() {
    const counts = await MODELS.Activity.aggregate([
        { $group: { _id: '$category', total: { $sum: 1 } } }
    ]);
    return counts.reduce((acc, row) => {
        acc[row._id] = row.total;
        return acc;
    }, {});
}

/**
 * The active slugs an activity is allowed to carry. Used by the activities
 * controller in place of the hard-coded list it used to validate against.
 */
async function activeCategorySlugs() {
    const categories = await MODELS.Category.find({ isActive: true }).select('slug').lean();
    return categories.map((category) => category.slug);
}

module.exports = {
    activeCategorySlugs,

    getCategories: async (req, res) => {
        try {
            const { activeOnly } = req.query;
            const query = activeOnly === 'true' ? { isActive: true } : {};

            const [categories, counts] = await Promise.all([
                MODELS.Category.find(query).sort({ sortOrder: 1, name: 1 }).lean(),
                countBySlug()
            ]);

            OUTPUT.responseSuccess(res, categories.map((category) => ({
                ...category,
                activityCount: counts[category.slug] || 0
            })));
        } catch (error) {
            OUTPUT.responseError(res, error);
        }
    },

    createCategory: async (req, res) => {
        try {
            const { body } = req;
            const name = String(body.name || '').trim();
            if (!name) { throw { statusCode: 400, message: 'Category name is required' } }

            const slug = slugify(name);
            if (!slug) { throw { statusCode: 400, message: 'Category name must contain at least one letter or number' } }

            const existing = await MODELS.Category.findOne({ slug }).lean();
            if (existing) { throw { statusCode: 400, message: `"${existing.name}" already uses that name` } }

            // New categories land at the end of the list.
            const last = await MODELS.Category.findOne({}).sort({ sortOrder: -1 }).select('sortOrder').lean();

            const data = await MODELS.Category.create({
                name,
                slug,
                description: body.description || '',
                sortOrder: last ? last.sortOrder + 1 : 0,
                isActive: body.isActive !== false
            });

            revalidateSiteTag(CATEGORIES_TAG);
            OUTPUT.responseSuccess(res, data);
        } catch (error) {
            OUTPUT.responseError(res, error);
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { body } = req;
            if (!ObjectId.isValid(body._id)) { throw { statusCode: 400, message: 'Invalid category id' } }

            const category = await MODELS.Category.findOne({ _id: body._id });
            if (!category) { throw { statusCode: 404, message: 'Category not found' } }

            const update = {
                updatedDate: Date.now()
            };

            // The slug follows the name. Activities store the slug, so they are
            // moved to the new one in the same request - renaming a category must
            // never leave an activity pointing at a slug that no longer exists.
            let movedActivities = 0;
            if (body.name !== undefined) {
                const name = String(body.name).trim();
                if (!name) { throw { statusCode: 400, message: 'Category name is required' } }
                update.name = name;

                const slug = slugify(name);
                if (!slug) { throw { statusCode: 400, message: 'Category name must contain at least one letter or number' } }

                if (slug !== category.slug) {
                    const clash = await MODELS.Category.findOne({ slug, _id: { $ne: category._id } }).lean();
                    if (clash) { throw { statusCode: 400, message: `"${clash.name}" already uses that name` } }
                    update.slug = slug;
                }
            }

            if (body.description !== undefined) { update.description = body.description }
            if (body.isActive !== undefined) { update.isActive = !!body.isActive }
            if (body.sortOrder !== undefined) { update.sortOrder = Number(body.sortOrder) || 0 }

            await MODELS.Category.findOneAndUpdate({ _id: body._id }, update);

            if (update.slug) {
                const moved = await MODELS.Activity.updateMany(
                    { category: category.slug },
                    { category: update.slug }
                );
                movedActivities = moved.modifiedCount || moved.nModified || 0;
            }

            revalidateSiteTag(CATEGORIES_TAG);
            OUTPUT.responseSuccess(res, { updated: true, slug: update.slug || category.slug, movedActivities });
        } catch (error) {
            OUTPUT.responseError(res, error);
        }
    },

    /** Takes the ids in their new display order and rewrites sortOrder to match. */
    reorderCategories: async (req, res) => {
        try {
            const { body } = req;
            const ids = Array.isArray(body.ids) ? body.ids : [];
            if (!ids.length) { throw { statusCode: 400, message: 'An ordered list of category ids is required' } }
            if (ids.some((id) => !ObjectId.isValid(id))) { throw { statusCode: 400, message: 'Invalid category id' } }

            await Promise.all(ids.map((id, index) => MODELS.Category.findOneAndUpdate(
                { _id: id },
                { sortOrder: index, updatedDate: Date.now() }
            )));

            revalidateSiteTag(CATEGORIES_TAG);
            OUTPUT.responseSuccess(res, true);
        } catch (error) {
            OUTPUT.responseError(res, error);
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { categoryId } = req.params;
            if (!ObjectId.isValid(categoryId)) { throw { statusCode: 400, message: 'Invalid category id' } }

            const category = await MODELS.Category.findOne({ _id: categoryId }).lean();
            if (!category) { throw { statusCode: 404, message: 'Category not found' } }

            // Deleting a category that activities are filed under would leave them
            // pointing at nothing, so it is refused rather than cascaded.
            const inUse = await MODELS.Activity.countDocuments({ category: category.slug });
            if (inUse > 0) {
                throw {
                    statusCode: 400,
                    message: `${inUse} activit${inUse === 1 ? 'y is' : 'ies are'} still in "${category.name}". Move them first, or switch the category off instead.`
                }
            }

            await MODELS.Category.deleteOne({ _id: categoryId });

            revalidateSiteTag(CATEGORIES_TAG);
            OUTPUT.responseSuccess(res, true);
        } catch (error) {
            OUTPUT.responseError(res, error);
        }
    }
};
