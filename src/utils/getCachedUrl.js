import { Cache } from 'aws-amplify/utils';
import { getUrl } from 'aws-amplify/storage';

const getCachedUrl = async (filePath) => {

    if (!filePath) {
        return null;
    }
    
    // If it's already a data URL or HTTP(S) URL, return it directly
    if (filePath.startsWith('data:') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
        console.log('getCachedUrl: returning URL directly', filePath.substring(0, 50) + '...');
        return filePath;
    }
    
    console.log('getCachedUrl', filePath);
    const cachePath = 'getCachedUrl_' + filePath;
    const cachedFile = await Cache.getItem(cachePath);
    if (cachedFile) {
        console.log('getCachedUrl.cachedFile', cachedFile);
        return cachedFile;
    }
    else {
        console.log('getCachedUrl.cachedFile not found');
        const expires = (new Date()).getTime() + 3540000; // 60 minutes
        const _file = await getUrl({ path: filePath });
        console.log('getCachedUrl._file', _file);
        const _href = _file?.url?.href;
        console.log('getCachedUrl._href', _href);
        Cache.setItem(cachePath, _href, { expires });
        return _href;
    }
};

export default getCachedUrl;
