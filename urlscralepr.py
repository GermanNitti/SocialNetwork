import csv
import os
import time
import random
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


OUTPUT_CSV = "9gag_urls.csv"
MAX_URLS_PER_CATEGORY = 50
PAGE_LOAD_TIMEOUT = 30

CATEGORIES = {
    "oldmeme": "https://9gag.com/interest/oldmeme",
    "anime": "https://9gag.com/interest/anime",
    "news": "https://9gag.com/interest/news",
    "cosplay": "https://9gag.com/interest/cosplay",
    "politics": "https://9gag.com/interest/politics",
    "memes": "https://9gag.com/interest/memes",
    "games": "https://9gag.com/interest/games",
    "wtf": "https://9gag.com/interest/wtf",
    "relationship": "https://9gag.com/interest/relationship",
    "music": "https://9gag.com/interest/music",
    "motorvehicles": "https://9gag.com/interest/motorvehicles",
    "animals": "https://9gag.com/interest/animals",
    "science": "https://9gag.com/interest/science",
    "comic": "https://9gag.com/interest/comic",
    "wholesome": "https://9gag.com/interest/wholesome",
    "sports": "https://9gag.com/interest/sports",
    "movies": "https://9gag.com/interest/movies",
    "cats": "https://9gag.com/interest/cats",
    "food": "https://9gag.com/interest/food",
    "lifestyle": "https://9gag.com/interest/lifestyle",
}


def extract_video_id(url):
    """Extrae el ID único del video (ej: aE0jr5o de ambas variantes)"""
    if not url:
        return None
    try:
        # Extraer el nombre del archivo sin extensión
        # /photo/aE0jr5o_460sv.mp4 -> aE0jr5o_460sv
        filename = url.split('/')[-1].replace('.mp4', '')
        
        # Remover variantes (_460sv, _460svav1, etc)
        # aE0jr5o_460sv -> aE0jr5o
        video_id = filename.split('_')[0]
        
        return video_id
    except:
        return None


def load_existing_urls(csv_path):
    """Carga URLs ya extraídas para evitar duplicados"""
    urls = set()
    video_ids = set()
    
    if not os.path.exists(csv_path):
        return urls, video_ids

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            url = row["url"]
            urls.add(url)
            
            # Guardar también el ID del video
            vid_id = extract_video_id(url)
            if vid_id:
                video_ids.add(vid_id)
    
    return urls, video_ids


def setup_driver():
    """Configura Chrome con opciones anti-detección y bloqueador de ads"""
    options = Options()
    
    # User-Agent realista (actualiza si es necesario)
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # Anti-detección crítica
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    # Opciones de navegador
    options.add_argument("--start-maximized")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-infobars")
    
    # SSL y seguridad
    options.add_argument("--ignore-certificate-errors")
    options.add_argument("--ignore-ssl-errors")
    
    # Reducir logs
    options.add_argument("--log-level=3")
    
    # 🆕 LIMPIAR CACHE Y COOKIES (empezar fresco)
    options.add_argument("--incognito")  # Modo incógnito
    options.add_argument("--disable-application-cache")
    options.add_argument("--disk-cache-size=0")
    
    # Bloquear ads y trackers (mejora la velocidad)
    prefs = {
        "profile.managed_default_content_settings.images": 2,  # Bloquear imágenes (acelera carga)
        "profile.default_content_setting_values": {
            "notifications": 2,
            "media_stream_mic": 2,
            "media_stream_camera": 2,
        }
    }
    options.add_experimental_option("prefs", prefs)
    
    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
    
    # Ocultar webdriver property
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    # Script para bloquear requests de ads
    driver.execute_cdp_cmd('Network.setBlockedURLs', {
        "urls": [
            "*ads.stickyadstv.com*",
            "*cs.lkqd.net*",
            "*t.adx.opera.com*",
            "*doubleclick.net*",
            "*googlesyndication.com*",
            "*googletagmanager.com*",
            "*ad.360yield.com*",
            "*sync.search.spotxchange.com*",
            "*csync.loopme.me*",
            "*shb-sync.com*",
            "*measureadv.com*",
            "*/ad/*",
            "*/ads/*",
        ]
    })
    driver.execute_cdp_cmd('Network.enable', {})
    
    print("[✓] Bloqueador de ads activado")
    
    return driver


def human_delay(min_sec=1, max_sec=3):
    """Delay aleatorio para simular comportamiento humano"""
    time.sleep(random.uniform(min_sec, max_sec))


def safe_get(driver, url, retries=3):
    """Intenta cargar URL con reintentos"""
    for i in range(retries):
        try:
            driver.get(url)
            human_delay(2, 4)  # Espera después de cargar
            return True
        except Exception as e:
            print(f"[!] Error cargando {url} (intento {i + 1}): {e}")
            human_delay(3, 6)
    return False


def debug_page_content(driver):
    """Debuggea el contenido de la página para detectar problemas"""
    print("\n[DEBUG] Analizando contenido de la página...")
    
    # Verificar si hay MP4s en el HTML
    html = driver.page_source
    mp4_count = html.count('.mp4')
    print(f"[DEBUG] Menciones de '.mp4' en HTML: {mp4_count}")
    
    # Intentar encontrar videos con diferentes selectores
    selectors = [
        "video source[src$='.mp4']",
        "video source",
        "source[src*='.mp4']",
        "video",
        "source[type='video/mp4']"
    ]
    
    for selector in selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            print(f"[DEBUG] Selector '{selector}': {len(elements)} elementos")
        except Exception as e:
            print(f"[DEBUG] Error con selector '{selector}': {e}")
    
    # Verificar scripts que puedan cargar videos dinámicamente
    scripts = driver.find_elements(By.TAG_NAME, "script")
    print(f"[DEBUG] Scripts en página: {len(scripts)}")


def extract_video_urls(driver):
    """Extrae URLs de videos con múltiples estrategias y manejo de errores"""
    urls = []
    
    # Estrategia 1: Source dentro de video
    try:
        sources = driver.find_elements(By.CSS_SELECTOR, "video source[src$='.mp4']")
        for src in sources:
            try:
                url = src.get_attribute("src")
                if url:
                    urls.append(url)
            except:
                continue
    except Exception as e:
        print(f"[DEBUG] Error estrategia 1: {e}")
    
    # Estrategia 2: Cualquier source con MP4
    if not urls:
        try:
            sources = driver.find_elements(By.CSS_SELECTOR, "source[src*='.mp4']")
            for src in sources:
                try:
                    url = src.get_attribute("src")
                    if url and '.mp4' in url:
                        urls.append(url)
                except:
                    continue
        except Exception as e:
            print(f"[DEBUG] Error estrategia 2: {e}")
    
    # Estrategia 3: Videos con data-src
    if not urls:
        try:
            sources = driver.find_elements(By.CSS_SELECTOR, "video source")
            for src in sources:
                try:
                    url = src.get_attribute("data-src") or src.get_attribute("src")
                    if url and '.mp4' in url:
                        urls.append(url)
                except:
                    continue
        except Exception as e:
            print(f"[DEBUG] Error estrategia 3: {e}")
    
    return list(set(urls))  # Eliminar duplicados


def safe_execute_script(driver, script, default_value=None, retries=2):
    """Ejecuta JavaScript con manejo de errores y reintentos"""
    for attempt in range(retries):
        try:
            return driver.execute_script(script)
        except Exception as e:
            if attempt < retries - 1:
                print(f"[!] Error ejecutando script (reintento {attempt + 1}): {str(e)[:50]}")
                time.sleep(2)
            else:
                print(f"[!] Script falló después de {retries} intentos")
                return default_value
    return default_value


def main():
    print("=" * 60)
    print("9GAG VIDEO SCRAPER - VERSIÓN MEJORADA")
    print("=" * 60)
    
    seen_urls = load_existing_urls(OUTPUT_CSV)
    seen_urls, seen_video_ids = load_existing_urls(OUTPUT_CSV)
    file_exists = os.path.exists(OUTPUT_CSV)
    
    print(f"\n[INFO] URLs ya extraídas: {len(seen_urls)}")
    print(f"[INFO] Videos únicos (IDs): {len(seen_video_ids)}")
    
    driver = setup_driver()
    print("[✓] Driver configurado con anti-detección\n")

    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["url", "categoria", "fecha_extraccion"]
        )

        if not file_exists:
            writer.writeheader()

        for category, url in CATEGORIES.items():
            print(f"\n{'=' * 60}")
            print(f"[+] Categoría: {category.upper()}")
            print(f"    URL: {url}")
            print("=" * 60)

            if not safe_get(driver, url):
                print(f"[X] No se pudo cargar {category}")
                continue

            # Esperar a que carguen los videos
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.TAG_NAME, "video"))
                )
                print("[✓] Videos detectados en página")
            except:
                print("[!] WARNING: No se detectaron videos inicialmente")
                print("[!] Intentando esperar más tiempo...")
                human_delay(5, 8)  # Espera adicional por si acaso
            
            human_delay(3, 5)
            
            # Debug en la primera categoría
            if category == list(CATEGORIES.keys())[0]:
                debug_page_content(driver)

            collected = 0
            scroll_attempts = 0
            session_urls = set()
            session_video_ids = set()  # IDs de videos ya procesados en esta sesión
            consecutive_errors = 0  # Contador de errores consecutivos
            last_height = safe_execute_script(driver, "return document.body.scrollHeight", 0)

            while collected < MAX_URLS_PER_CATEGORY:
                try:
                    # Extraer URLs con múltiples estrategias
                    video_urls = extract_video_urls(driver)
                    
                    print(f"\n   [SCAN] Videos encontrados en DOM: {len(video_urls)}")
                    
                    new_found = 0

                    for video_url in video_urls:
                        # Extraer ID del video
                        video_id = extract_video_id(video_url)
                        
                        # Saltar si:
                        # - URL vacía
                        # - URL ya vista (duplicado exacto)
                        # - ID del video ya procesado (diferentes variantes del mismo video)
                        if (
                            not video_url
                            or video_url in seen_urls
                            or video_url in session_urls
                            or video_id in seen_video_ids
                            or video_id in session_video_ids
                        ):
                            continue

                        writer.writerow({
                            "url": video_url,
                            "categoria": category,
                            "fecha_extraccion": datetime.utcnow().isoformat()
                        })
                        f.flush()

                        seen_urls.add(video_url)
                        session_urls.add(video_url)
                        
                        # Marcar el ID como procesado
                        if video_id:
                            seen_video_ids.add(video_id)
                            session_video_ids.add(video_id)

                        collected += 1
                        new_found += 1

                        print(f"   [+] ({collected}/{MAX_URLS_PER_CATEGORY}) ID:{video_id} - {video_url[:70]}...")

                        if collected >= MAX_URLS_PER_CATEGORY:
                            break

                    # Reset error counter si encontramos videos
                    if new_found > 0:
                        consecutive_errors = 0

                    # Lógica de scroll mejorada
                    if new_found == 0:
                        scroll_attempts += 1
                        print(f"   [⚠] Sin nuevos videos (intento {scroll_attempts}/25)")
                    else:
                        scroll_attempts = 0

                    # Scroll humano con variación
                    scroll_distance = random.randint(300, 600)
                    safe_execute_script(driver, f"window.scrollBy(0, {scroll_distance});")
                    human_delay(0.8, 1.5)

                    # Scroll grande ocasional para cargar más contenido
                    if scroll_attempts % 4 == 0 and scroll_attempts > 0:
                        print("   [⬇] Scroll grande para cargar más contenido...")
                        safe_execute_script(driver, "window.scrollBy(0, document.body.scrollHeight);")
                        human_delay(2, 4)
                    
                    # Verificar si llegamos al final
                    new_height = safe_execute_script(driver, "return document.body.scrollHeight", last_height)
                    if new_height == last_height:
                        scroll_attempts += 1
                    else:
                        last_height = new_height

                    # Salir si no hay progreso
                    if scroll_attempts >= 25:
                        print("   [!] Sin progreso después de 25 intentos, pasando a siguiente categoría")
                        break
                
                except Exception as e:
                    consecutive_errors += 1
                    print(f"\n   [ERROR] Excepción en el loop: {str(e)[:100]}")
                    print(f"   [!] Errores consecutivos: {consecutive_errors}/5")
                    
                    # Si hay muchos errores consecutivos, salir de esta categoría
                    if consecutive_errors >= 5:
                        print("   [X] Demasiados errores, saltando categoría")
                        break
                    
                    # Intentar recuperar
                    try:
                        print("   [↻] Intentando recuperar conexión...")
                        driver.execute_script("window.scrollBy(0, 100);")
                        human_delay(3, 5)
                    except:
                        print("   [X] No se pudo recuperar, saltando categoría")
                        break

            print(f"\n[✓] {category}: {collected}/{MAX_URLS_PER_CATEGORY} videos extraídos")
            
            # Delay entre categorías para parecer más humano
            if category != list(CATEGORIES.keys())[-1]:
                delay = random.randint(10, 20)  # 🆕 Delays MÁS LARGOS (antes 5-10)
                print(f"[⏳] Esperando {delay}s antes de siguiente categoría...")
                time.sleep(delay)

    driver.quit()
    print("\n" + "=" * 60)
    print("✓ SCRAPING COMPLETADO")
    print("=" * 60)
    print(f"Archivo guardado: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()