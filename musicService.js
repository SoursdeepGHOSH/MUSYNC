import { supabase } from './supabaseClient.js';

export async function getUserLibrary() {
    const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('upload_date', { ascending: false });

    if (error) throw error;
    return data;
}

export async function uploadMedia(file) {
    const fileExt = file.name.split('.').pop();
    // generate UUID-like random string since we don't have uuid npm package locally without import maps
    const randomId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const fileName = `${randomId}.${fileExt}`;
    const filePath = `user_uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

    // Save to DB
    const { data, error } = await supabase
        .from('media_files')
        .insert([{
            filename: fileName,
            original_name: file.name,
            file_type: file.type.startsWith('audio') ? 'audio' : 'video',
            mime_type: file.type,
            file_size: file.size,
            title: file.name.replace(/\.[^/.]+$/, ""),
            file_path: publicUrlData.publicUrl
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteMedia(id) {
    // get file path
    const { data: fileData, error: fetchErr } = await supabase
        .from('media_files')
        .select('filename')
        .eq('id', id)
        .single();

    if (fileData) {
        await supabase.storage.from('media').remove([`user_uploads/${fileData.filename}`]);
    }

    const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}
