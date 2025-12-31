/**
 * Custom update tags for the application.
 * These are used alongside Lexical's built-in tag constants.
 * 
 * Per Lexical best practices, define custom tags as constants
 * to maintain consistency and type safety.
 */

/**
 * Tag for updates triggered by DataStore subscription changes.
 * Used to prevent recursive saves when external updates arrive.
 */
export const DATASTORE_UPDATE_TAG = 'datastore-update';

/**
 * Tag for the initial editor state load from the database.
 * Used to skip onChange save logic during first load.
 */
export const INITIAL_LOAD_TAG = 'initial-load';
