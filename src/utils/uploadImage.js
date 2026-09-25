//  Upload any image to Cloudinary for FREE
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'storages'); // paste your preset name
  formData.append('cloud_name', 'dcxmbnes6');       // paste your cloud name

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dcxmbnes6/image/upload`, // paste your cloud name
    {
      method: 'POST',
      body: formData
    }
  );

  const data = await response.json();
  return data.secure_url; //  returns the image URL
}

//  New video upload function
export async function uploadVideo(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'storages');
  formData.append('cloud_name', 'dcxmbnes6');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dcxmbnes6/video/upload`,
    {
      method: 'POST',
      body: formData
    }
  );
  const data = await response.json();
  return data.secure_url;
}