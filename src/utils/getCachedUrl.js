import { Cache } from 'aws-amplify/utils';
import { getUrl } from 'aws-amplify/storage';
import { isForbiddenIdentityError, recoverForbiddenIdentity } from './authSessionRecovery';

const PRESIGNED_URL_EXPIRY_SECONDS = 60 * 60;
const CACHE_EXPIRY_BUFFER_MS = 60_000;

const getCachedUrl = async (filePath) => {

    if (!filePath) {
        return null;
    }
    
    // If it's already a data URL or HTTP(S) URL, return it directly
    if (filePath.startsWith('data:') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }

    // Public paths are served directly from CloudFront — no presigning needed.
    // The CDN URL is stable (no expiry), so we skip the Amplify Cache layer too.
    const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN;
    if (cdnDomain && filePath.startsWith('public/')) {
        return `https://${cdnDomain}/${filePath}`;
    }
    
    const cachePath = 'getCachedUrl_v3_' + filePath;
    const cachedFile = await Cache.getItem(cachePath);
    if (cachedFile) {
        return cachedFile;
    }
    else {
        let _file;
        try {
            _file = await getUrl({
                path: filePath,
                options: { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS },
            });
        } catch (error) {
            if (!isForbiddenIdentityError(error)) throw error;
            await recoverForbiddenIdentity();
            _file = await getUrl({
                path: filePath,
                options: { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS },
            });
        }
        const _href = _file?.url?.href;
        const cacheExpiresAt = _file.expiresAt.getTime() - CACHE_EXPIRY_BUFFER_MS;
        if (cacheExpiresAt > Date.now()) {
            Cache.setItem(cachePath, _href, { expires: cacheExpiresAt });
        }
        return _href;
    }
};

export default getCachedUrl;
