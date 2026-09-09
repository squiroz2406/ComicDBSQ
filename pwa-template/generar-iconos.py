#!/usr/bin/env python3
"""
Generador de íconos placeholder para el template PWA.
Crea íconos de 192x192 y 512x512 píxeles con un color de fondo
y las iniciales de la aplicación.

Uso:
    python3 generar-iconos.py --nombre "Mi App" --color "#1F4E79"

Requisitos:
    pip install Pillow
"""

import argparse
import os

def generar_icono(tamanio, nombre, color, ruta_salida):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("Error: necesitás instalar Pillow. Ejecutá: pip install Pillow")
        return False

    img = Image.new('RGB', (tamanio, tamanio), color=color)
    draw = ImageDraw.Draw(img)

    # Usar las iniciales del nombre
    iniciales = ''.join(p[0].upper() for p in nombre.split()[:2])

    # Calcular tamaño de fuente proporcional
    font_size = tamanio // 3
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()

    # Centrar el texto
    bbox = draw.textbbox((0, 0), iniciales, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (tamanio - text_w) // 2
    y = (tamanio - text_h) // 2

    draw.text((x, y), iniciales, fill='white', font=font)
    img.save(ruta_salida, 'PNG')
    print(f"Ícono generado: {ruta_salida}")
    return True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generador de íconos PWA')
    parser.add_argument('--nombre', default='Mi App', help='Nombre de la aplicación')
    parser.add_argument('--color', default='#1F4E79', help='Color de fondo en hex')
    args = parser.parse_args()

    os.makedirs('icons', exist_ok=True)

    generar_icono(192, args.nombre, args.color, 'icons/icon-192.png')
    generar_icono(512, args.nombre, args.color, 'icons/icon-512.png')

    print("\n¡Íconos generados correctamente!")
    print("Podés reemplazarlos por tus propios íconos cuando tengas el diseño final.")
