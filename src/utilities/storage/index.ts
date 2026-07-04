import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(URL, KEY, {
    auth: {
        flowType: "pkce",
        detectSessionInUrl: false,
    },
});

export const uploadFile = async (file: File) => {
    const { data, error } = await supabase.storage.from("media").upload(`${Date.now()}`, file);
    if (error) {
        return console.log(error);
    }
    return data.path;
};
