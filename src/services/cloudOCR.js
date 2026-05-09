// Optional: Use Baidu OCR API for faster processing
export async function cloudRecognize(imageData) {
  const API_KEY = 'YOUR_BAIDU_API_KEY'; // User provides their own
  const SECRET_KEY = 'YOUR_BAIDU_SECRET_KEY';
  
  // Get access token
  const tokenRes = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`
  );
  const { access_token } = await tokenRes.json();
  
  // Recognize text
  const response = await fetch(
    `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${access_token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `image=${encodeURIComponent(imageData.split(',')[1])}`
    }
  );
  
  const data = await response.json();
  return data.words_result.map(w => w.words).join('\n');
}