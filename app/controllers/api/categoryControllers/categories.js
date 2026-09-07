module.exports = {
    /**
     * The category filter the website renders. Only active categories are
     * returned, and each carries the number of published activities in it so the
     * site can hide or grey out a filter that would lead to an empty page.
     */
    getCategories: async (req, res) => {
        try {
            const categories = await MODELS.Category.find({ isActive: true })
                .sort({ sortOrder: 1, name: 1 })
                .select('name slug description sortOrder')
                .lean();

            const counts = await MODELS.Activity.aggregate([
                { $match: { status: { $ne: 'draft' }, isActive: { $ne: false } } },
                { $group: { _id: '$category', total: { $sum: 1 } } }
            ]);

            const bySlug = counts.reduce((acc, row) => {
                acc[row._id] = row.total;
                return acc;
            }, {});

            OUTPUT.responseSuccess(res, categories.map((category) => ({
                ...category,
                activityCount: bySlug[category.slug] || 0
            })));
        } catch (error) {
            OUTPUT.responseError(res, error);
        }
    }
};
