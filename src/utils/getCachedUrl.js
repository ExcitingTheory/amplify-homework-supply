import { Cache } from 'aws-amplify/utils';
import { getUrl } from 'aws-amplify/storage';

const getCachedUrl = async (filePath, accessLevel = 'protected', targetIdentityId = null) => {

    if (!filePath) {
        return null;
    }
    // Cache.clear();
    console.log('getCachedUrl', filePath, accessLevel, targetIdentityId);
    const cachePath = 'getCachedUrl_' + accessLevel + targetIdentityId + filePath;
    const cachedFile = await Cache.getItem(cachePath);
    if (cachedFile) {
        console.log('getCachedUrl.cachedFile', cachedFile);
        return cachedFile;
    }
    else {
        console.log('getCachedUrl.cachedFile not found');
        const expires = (new Date()).getTime() + 3540000; // 60 minutes in milliseconds, the url expiration time from getUrl is 60 minutes
        const _file = await getUrl({
            key: filePath,
            options: {
                accessLevel,
                targetIdentityId,
                expiresIn: 3600
            }
        });
        console.log('getCachedUrl._file', _file);
        const _href = _file?.url?.href;
        console.log('getCachedUrl._href', _href);
        Cache.setItem(cachePath, _href, { expires });
        return _href;
    }
};

export default getCachedUrl;
