import {
    getCurrentUser,
    fetchAuthSession
 } from "aws-amplify/auth";

let memoizedUser;
let memoizedIdentity;
let memoizedAuthSession;

export async function getMemoizedUser() {
    if (!memoizedUser) {
        const { username: myUserId } = await getCurrentUser();
        console.log("myUserId::: ", myUserId);
        memoizedUser = myUserId;
    }
    return {
        username: memoizedUser,
    };
}

export async function getIdentity() {
    if (!memoizedIdentity || !memoizedAuthSession) {
        const {
            identityId,
            tokens: { idToken },
        } = await fetchAuthSession();
        console.log("identityId::: ", identityId);
        memoizedIdentity = identityId;
        memoizedAuthSession = idToken;
    }
    return {
        identityId: memoizedIdentity,
        idToken: memoizedAuthSession,
    };

}

