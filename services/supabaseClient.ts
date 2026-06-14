
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : new Proxy({} as any, {
        get(target, prop) {
            return () => {
                return {
                    from: () => ({
                        select: () => ({
                            order: () => ({
                                range: () => Promise.resolve({ data: [], error: null })
                            }),
                            range: () => Promise.resolve({ data: [], error: null })
                        }),
                        insert: () => Promise.resolve({ data: null, error: null }),
                        update: () => ({
                            eq: () => Promise.resolve({ data: null, error: null })
                        }),
                        delete: () => ({
                            in: () => Promise.resolve({ data: [], error: null }),
                            eq: () => Promise.resolve({ data: null, error: null })
                        })
                    })
                };
            };
        }
    });
