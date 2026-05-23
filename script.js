const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vROmuZN2U6pcqmpyl4_HLQXnY5Ls2kAatS6gUeQwNq58EmyrhJV_J2YeVxAIlak_WPkYCfXF0JM4nsO/pub?output=csv";
let menuData = [];
let currentLang = 'GR'; // Default

function fetchMenuData() {
    const FRESH_URL = SHEET_CSV_URL + "&t=" + new Date().getTime();
    
    Papa.parse(FRESH_URL, {
        download: true,
        header: true,
        complete: function(results) {
            menuData = results.data.filter(item => item.Category && item.Category.trim() !== ""); 
            renderCategories();
            renderMenu();
        },
        error: function(error) {
            console.error("Σφάλμα:", error);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Ανίχνευση γλώσσας
    const userLang = navigator.language || navigator.userLanguage;
    currentLang = userLang.startsWith('el') ? 'GR' : 'EN';

    // Ρύθμιση αρχικού κειμένου στο κουμπί της γλώσσας ανάλογα με τον browser
    const langBtn = document.getElementById('lang-toggle');
    langBtn.innerHTML = currentLang === 'GR' ? '<i class="fa-solid fa-globe"></i> EN' : '<i class="fa-solid fa-globe"></i> GR';

    fetchMenuData();
    setInterval(fetchMenuData, 60000);

    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'GR' ? 'EN' : 'GR';
        langBtn.innerHTML = currentLang === 'GR' ? '<i class="fa-solid fa-globe"></i> EN' : '<i class="fa-solid fa-globe"></i> GR';
        renderCategories(); 
        renderMenu();
    });
});

function getVisibleItems() {
    const today = new Date().getDay(); // 0 = Κυριακή
    return menuData.filter(item => {
        if (item.Name_GR && item.Name_GR.includes("Ρεβυθάδα")) {
            const forceShow = item.Force_Show && item.Force_Show.trim().toUpperCase() === 'TRUE';
            return today === 0 || forceShow;
        }
        return true; 
    });
}

function renderCategories() {
    const visibleItems = getVisibleItems();
    const categoryMap = new Map();
    
    const revithadaItem = visibleItems.find(item => item.Name_GR && item.Name_GR.includes("Ρεβυθάδα"));
    if (revithadaItem && revithadaItem.Category) {
        categoryMap.set(revithadaItem.Category, revithadaItem.Category_EN || revithadaItem.Category);
    }

    visibleItems.forEach(item => {
        if (!categoryMap.has(item.Category)) {
            categoryMap.set(item.Category, item.Category_EN || item.Category);
        }
    });

    const nav = document.querySelector('.sticky-nav');
    nav.innerHTML = '';
    let index = 0;

    for (const [catGR, catEN] of categoryMap.entries()) {
        const btn = document.createElement('button');
        btn.className = `category-btn ${index === 0 ? 'active' : ''}`;
        const catId = `cat-${catGR.replace(/\s+/g, '-')}`; 
        
        btn.innerText = currentLang === 'GR' ? catGR : catEN;
        
        btn.onclick = () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            scrollToCategory(catId);
        };
        nav.appendChild(btn);
        index++;
    }
}

function renderMenu() {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';

    const visibleItems = getVisibleItems();
    let categories = [...new Set(visibleItems.map(item => item.Category))];

    const revithadaItem = visibleItems.find(item => item.Name_GR && item.Name_GR.includes("Ρεβυθάδα"));
    if (revithadaItem && revithadaItem.Category) {
        const specialIndex = categories.indexOf(revithadaItem.Category);
        if (specialIndex > -1) {
            categories.splice(specialIndex, 1);
            categories.unshift(revithadaItem.Category); 
        }
    }

    categories.forEach((cat, index) => {
        const catItems = visibleItems.filter(item => item.Category === cat);
        const catId = `cat-${cat.replace(/\s+/g, '-')}`;
        
        const displayTitle = currentLang === 'GR' ? cat : (catItems[0].Category_EN || cat);

        let sectionHTML = `
            <div id="${catId}" class="category-section">
                <h2 class="category-title">${displayTitle}</h2>
        `;

        catItems.forEach(item => {
            const isRevithada = item.Name_GR && item.Name_GR.includes("Ρεβυθάδα");
            const name = currentLang === 'GR' ? item.Name_GR : item.Name_EN;
            const desc = currentLang === 'GR' ? item.Desc_GR : item.Desc_EN;

            if (isRevithada) {
                // --- SPECIAL ΡΕΒΥΘΑΔΑ ---
                const rawPrice = item.Price ? parseFloat(item.Price.toString().replace('€', '').replace(',', '.').trim()) : 0;
                const priceHTML = `<span class="item-price">${rawPrice > 0 ? rawPrice.toFixed(2) + '€' : ''}</span>`;
                
                const giagiaLabel = currentLang === 'GR' ? '<i class="fa-solid fa-heart"></i> Γιαγιά Special' : '<i class="fa-solid fa-heart"></i> Grandma\'s Special';
                const sundayPill = currentLang === 'GR' ? 'Μόνο Κυριακή!' : 'Sunday Only!';
                const descHTML = desc ? `<p class="item-desc" style="color: #555;">${desc}</p>` : '';

                sectionHTML += `
                    <div class="special-box">
                        <div class="giagia-text">${giagiaLabel}</div>
                        <div class="item-header">
                            <div class="item-name-container">
                                <h3 class="item-name">${name}</h3>
                                <span class="pill-sunday">${sundayPill}</span>
                            </div>
                            ${priceHTML}
                        </div>
                        ${descHTML}
                    </div>
                `;
            } else {
                // --- ΚΑΝΟΝΙΚΟ ΠΙΑΤΟ ---
                const availableStr = item.Available ? item.Available.toString().trim().toUpperCase() : 'TRUE';
                const isSoldOut = availableStr === 'FALSE';
                const badgeText = currentLang === 'GR' ? 'Μη διαθέσιμο' : 'Unavailable';

                const soldOutClass = isSoldOut ? 'sold-out' : '';
                let badgeHTML = isSoldOut ? `<span class="unavailable-badge">${badgeText}</span>` : '';
                
                // Πορτοκαλί Pill για το Λιβάδι 
                const isLivadi = item.Name_GR && item.Name_GR.toUpperCase().includes("ΤΟ ΛΙΒΑΔΙ");
                if (isLivadi && !isSoldOut) {
                    const livadiText = currentLang === 'GR' ? 'Special!' : 'House Special!';
                    badgeHTML += `<span class="pill-special"><i class="fa-solid fa-star"></i> ${livadiText}</span>`;
                }

                const descHTML = desc ? `<p class="item-desc">${desc}</p>` : '';

                const cleanPrice1 = item.Price ? item.Price.toString().replace('€', '').replace(',', '.').trim() : '0';
                const cleanPrice2 = item.Price_Wrap ? item.Price_Wrap.toString().replace('€', '').replace(',', '.').trim() : '0';
                const rawPrice1 = parseFloat(cleanPrice1) || 0;
                const rawPrice2 = parseFloat(cleanPrice2) || 0;

                let priceHTML = '';
                if (rawPrice2 > 0) {
                    const lblSkewer = currentLang === 'GR' ? 'Καλαμάκι:' : 'Skewer:';
                    const lblWrap = currentLang === 'GR' ? 'Τυλιχτό:' : 'Wrap:';
                    priceHTML = `
                        <div class="dual-price">
                            <div class="price-row"><span>${lblSkewer}</span> <b>${rawPrice1 > 0 ? rawPrice1.toFixed(2) + '€' : '-'}</b></div>
                            <div class="price-row"><span>${lblWrap}</span> <b>${rawPrice2 > 0 ? rawPrice2.toFixed(2) + '€' : '-'}</b></div>
                        </div>
                    `;
                } else {
                    priceHTML = `<span class="item-price">${rawPrice1 > 0 ? rawPrice1.toFixed(2) + '€' : ''}</span>`;
                }

                sectionHTML += `
                    <div class="menu-item ${soldOutClass}">
                        <div class="item-header">
                            <div class="item-name-container">
                                <h3 class="item-name">${name}</h3>
                                ${badgeHTML}
                            </div>
                            ${priceHTML}
                        </div>
                        ${descHTML}
                    </div>
                `;
            }
        });

        sectionHTML += `</div>`;
        container.innerHTML += sectionHTML;
    });
}

function scrollToCategory(id) {
    const element = document.getElementById(id);
    if(element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({top: y, behavior: 'smooth'});
    }
}
