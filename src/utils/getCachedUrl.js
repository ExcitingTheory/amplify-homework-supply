import { Cache } from 'aws-amplify/utils';
import { getUrl } from 'aws-amplify/storage';

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
    
    const cachePath = 'getCachedUrl_' + filePath;
    const cachedFile = await Cache.getItem(cachePath);
    if (cachedFile) {
        return cachedFile;
    }
    else {
        const expires = (new Date()).getTime() + 3540000; // 60 minutes
        const _file = await getUrl({ path: filePath });
        const _href = _file?.url?.href;
        Cache.setItem(cachePath, _href, { expires });
        return _href;
    }
};

export default getCachedUrl;
