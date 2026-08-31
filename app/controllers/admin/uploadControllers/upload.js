const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Only these ever reach the bucket. The browser picks the content type, so it is
// untrusted input - anything not on this list is refused.
const ALLOWED_CONTENT_TYPES = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
};

// Directories the CMS is allowed to write into. Keeps a caller from steering
// uploads into an arbitrary key prefix.
const ALLOWED_DIRS = ['properties', 'rooms', 'amenities', 'activities', 'events'];

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB

let cachedClient = null;

function getS3Client() {
    const { aws } = CONFIG;
    if (!aws || !aws.bucket) {
        throw { statusCode: 500, message: 'S3 bucket is not configured (set AWS_S3_BUCKET)' };
    }
    if (!aws.accessKeyId || !aws.secretAccessKey) {
        throw { statusCode: 500, message: 'S3 credentials are not configured (set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)' };
    }
    if (!cachedClient) {
        cachedClient = new S3Client({
            region: aws.region,
            credentials: {
                accessKeyId: aws.accessKeyId,
                secretAccessKey: aws.secretAccessKey,
            },
        });
    }
    return cachedClient;
}

module.exports = {
    // POST /admin/upload/presign
    // body: { contentType, dirName, size }
    // -> { uploadUrl, publicUrl, key, expiresIn }
    //
    // The browser never receives an AWS credential. It gets one short-lived URL
    // that can write exactly one object, and nothing else.
    presignUpload: async (req, res) => {
        try {
            const { contentType, dirName, size } = req.body || {};

            const extension = ALLOWED_CONTENT_TYPES[String(contentType || '').toLowerCase()];
            if (!extension) {
                throw { statusCode: 400, message: `Unsupported file type: ${contentType || 'unknown'}` };
            }

            if (size && Number(size) > MAX_UPLOAD_BYTES) {
                throw { statusCode: 400, message: `File is larger than ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB` };
            }

            const dir = ALLOWED_DIRS.indexOf(dirName) >= 0 ? dirName : ALLOWED_DIRS[0];

            const { aws } = CONFIG;
            const client = getS3Client();

            // Server-generated key. The client has no say in the path, and the
            // random suffix means concurrent uploads can never collide the way
            // a bare Date.now() filename did.
            const key = `${aws.uploadPrefix}/${dir}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

            const uploadUrl = await getSignedUrl(
                client,
                new PutObjectCommand({
                    Bucket: aws.bucket,
                    Key: key,
                    ContentType: contentType,
                }),
                { expiresIn: aws.presignExpirySeconds || 300 },
            );

            OUTPUT.responseSuccess(res, {
                uploadUrl,
                publicUrl: `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/${key}`,
                key,
                expiresIn: aws.presignExpirySeconds || 300,
            });
        } catch (error) {
            OUTPUT.responseError(res, error);
        }
    },
};
