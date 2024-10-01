


// get identityId
const userAttributes = await fetchUserAttributes();
      const {
        identityId,
      } = await fetchAuthSession();

// get owner 
      const { sub: username } = await fetchUserAttributes();