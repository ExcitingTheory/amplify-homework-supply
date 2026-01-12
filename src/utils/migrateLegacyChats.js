/**
 * Utility to migrate or clean up legacy ChatHistory records without assistantID
 * 
 * Run this once in your app to fix legacy data, then remove the call.
 * 
 * Options:
 * 1. deleteAllLegacy: true - Delete all legacy chats (recommended for clean start)
 * 2. migrateToCurrentAssistant: true - Assign current assistant to legacy chats (preserves history)
 */

import { DataStore } from 'aws-amplify/datastore';
import { ChatHistory, Assistant } from '../models';

export async function migrateLegacyChats(options = { deleteAllLegacy: true }) {
    console.log('[migrateLegacyChats] Starting migration...');
    
    try {
        // Get all ChatHistory records
        const allChats = await DataStore.query(ChatHistory);
        console.log(`[migrateLegacyChats] Found ${allChats.length} total chats`);
        
        // Find legacy chats (no assistantID)
        const legacyChats = allChats.filter(chat => !chat.assistantID);
        console.log(`[migrateLegacyChats] Found ${legacyChats.length} legacy chats without assistantID`);
        
        if (legacyChats.length === 0) {
            console.log('[migrateLegacyChats] No legacy chats found - database is clean!');
            return { success: true, deleted: 0, migrated: 0 };
        }
        
        // Option 1: Delete all legacy chats
        if (options.deleteAllLegacy) {
            console.log('[migrateLegacyChats] Deleting all legacy chats...');
            let deletedCount = 0;
            
            for (const chat of legacyChats) {
                try {
                    await DataStore.delete(chat);
                    deletedCount++;
                    console.log(`[migrateLegacyChats] Deleted legacy chat ${chat.id}`);
                } catch (error) {
                    console.error(`[migrateLegacyChats] Error deleting chat ${chat.id}:`, error);
                }
            }
            
            console.log(`[migrateLegacyChats] Deleted ${deletedCount} legacy chats`);
            return { success: true, deleted: deletedCount, migrated: 0 };
        }
        
        // Option 2: Migrate to current assistant
        if (options.migrateToCurrentAssistant) {
            console.log('[migrateLegacyChats] Migrating legacy chats to current assistant...');
            
            // Get or create assistant
            let assistants = await DataStore.query(Assistant);
            let assistant;
            
            if (assistants.length === 0) {
                console.log('[migrateLegacyChats] No assistant found, creating one...');
                assistant = await DataStore.save(new Assistant({
                    model: 'gpt-4',
                }));
            } else {
                assistant = assistants[0];
            }
            
            console.log(`[migrateLegacyChats] Using assistant: ${assistant.id}`);
            
            let migratedCount = 0;
            for (const chat of legacyChats) {
                try {
                    await DataStore.save(
                        ChatHistory.copyOf(chat, updated => {
                            updated.assistantID = assistant.id;
                        })
                    );
                    migratedCount++;
                    console.log(`[migrateLegacyChats] Migrated chat ${chat.id} to assistant ${assistant.id}`);
                } catch (error) {
                    console.error(`[migrateLegacyChats] Error migrating chat ${chat.id}:`, error);
                }
            }
            
            console.log(`[migrateLegacyChats] Migrated ${migratedCount} legacy chats`);
            return { success: true, deleted: 0, migrated: migratedCount };
        }
        
        console.warn('[migrateLegacyChats] No migration option selected');
        return { success: false, deleted: 0, migrated: 0 };
        
    } catch (error) {
        console.error('[migrateLegacyChats] Migration failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Count legacy chats without actually modifying them
 */
export async function countLegacyChats() {
    try {
        const allChats = await DataStore.query(ChatHistory);
        const legacyChats = allChats.filter(chat => !chat.assistantID);
        
        console.log(`[countLegacyChats] Total chats: ${allChats.length}`);
        console.log(`[countLegacyChats] Legacy chats: ${legacyChats.length}`);
        console.log(`[countLegacyChats] Modern chats: ${allChats.length - legacyChats.length}`);
        
        return {
            total: allChats.length,
            legacy: legacyChats.length,
            modern: allChats.length - legacyChats.length,
            legacyChats: legacyChats.map(c => ({
                id: c.id,
                createdAt: c.createdAt,
                messageCount: c.messages?.length || 0,
                archived: c.archived || false,
            }))
        };
    } catch (error) {
        console.error('[countLegacyChats] Error counting chats:', error);
        return { error: error.message };
    }
}
