-- Prague Spartans: Google Drive folder for the photo gallery (editable in Admin → Settings).
insert into public.site_settings (key, value)
values ('gallery_folder', 'https://drive.google.com/drive/folders/1Kg_5pM2cjpcnjsYaaFXwHxKUOqbitC0h')
on conflict (key) do nothing;
