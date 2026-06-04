from rembg import remove
from PIL import Image

input_path = '/Users/tanya/.gemini/antigravity-ide/brain/e1d2c50d-38b5-4255-a6c8-a3c8c93a1575/coffee_cutout_1780597753609.png'
output_path = '/Users/tanya/projects/brewops-platform/frontend/img/coffee.png'

print(f"Removing background from {input_path}")
try:
    input_img = Image.open(input_path)
    output_img = remove(input_img)
    output_img.save(output_path)
    print("Successfully removed background!")
except Exception as e:
    print(f"Error: {e}")
