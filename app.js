let cart =[];
let ExtraData = "clothshop"; //IT is the Github project name
document.addEventListener('DOMContentLoaded', async () => {

    // --- DOM Element References ---
    const navbar = {
        logo: document.querySelector('.logo'),
        aboutLink: document.getElementById('nav-about'),
        aboutLink_m: document.getElementById('nav-about-mobile'),
        productLink: document.getElementById('nav-product'),
        productLink_m: document.getElementById('nav-product-mobile'),
        mediaLink: document.getElementById('nav-media'),
        mediaLink_m: document.getElementById('nav-media-mobile'),
        memberLink: document.getElementById('nav-member'),
        memberLink_m: document.getElementById('nav-member-mobile'),
        contactLink: document.getElementById('nav-contact'), 
        contactLink_m: document.getElementById('nav-contact-mobile'),
        cartIconBtn: document.getElementById('cart-icon'),
        cartItemCountSpan: document.getElementById('cart-item-count')
    };

    const mainBody = {
        contentWrapper: document.getElementById('content-wrapper'),
        itemWrapper: document.getElementById('item-wrapper'),
        checkoutWrapper: document.getElementById('checkout-wrapper')
    };

    const contentContainers = {
        bannerSlider: document.getElementById('banner-slider-container'),
        about: document.getElementById('about-container'),
        productContainer: document.getElementById('product-container'), // Keep main container ref
        categoryFiltersContainer: document.querySelector('.category-filters'), // ADD Filter container ref
        productGrid: document.querySelector('#product-container .product-grid') // ADD Single grid ref
    };
     // --- State Variables ---
    // let cart = []; a Global parameter now
    let currentView = 'content';
    let allProductsData = []; // Store the original full list of products
    let allItemDetails = {};
    let currentFilterCategory = 'All'; // ADD state for the active filter, default to 'All'

    const sideCart = {
        aside: document.getElementById('side-cart'),
        itemsContainer: document.getElementById('side-cart-items'),
        closeBtn: document.getElementById('close-cart-btn'),
        totalSpan: document.getElementById('cart-total'),
        checkoutBtn: document.getElementById('checkout-btn')
    };

    const checkoutForm = document.getElementById('checkout-form');

    // --- Data Fetching Functions ---
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Could not fetch data from ${url}:`, error);
            return null; // Return null or appropriate error indicator
        }
    }

    //Validate Promo Code
    function validateDiscountCode(inputCode) {
      const member = membershipData.find(m =>
        m.discountCode.toLowerCase() === inputCode.trim().toLowerCase()
      );

      if (member) {
        const tier = member.tier.toLowerCase();

        // ✅ Save for later use (reward, display, etc.)
        sessionStorage.setItem('discountCode', member.discountCode);
        sessionStorage.setItem('discountTier', member.tier);
       

        switch (tier) {
          case 'gold':
            return 0.05;
          case 'silver':
            return 0.03;
          case 'bronze':
            return 0.01;
          default:
            return 0;
        }
      } else {
        // ❌ Clear old values if invalid
        sessionStorage.removeItem('discountCode');
        sessionStorage.removeItem('discountTier'); 
        return 0;
      }
    }

    //Read Discount Code pushed from GAS!
        let membershipData = []; // Store membership data globally

        async function loadMembershipData() {
            try {
                const response = await fetch(' https://script.google.com/macros/s/AKfycbzZhiPYkL62ZHeRMi1-RCkVQUodJDe6IR7UvNouwM1bkHmepJAfECA4JF1_HHLn9Zu7Yw/exec'); // Replace with your Web App URL
                membershipData = await response.json();
                console.log("Loaded membership promo codes:", membershipData);
            } catch (error) {
                console.error('Failed to load membership data:', error);
            }
        }
    // --- Rendering Functions ---

     function renderBanner(bannerData) {
        const bannerContainer = $('#banner-slider-container'); // Use jQuery selector
        bannerContainer.empty(); // Clear previous content
        
        if (!bannerData || bannerData.length === 0) {
             bannerContainer.html('<p>No banners available.</p>');
             return false; // Indicate failure or no banners
        }

        // Create slides using jQuery
        bannerData.forEach((banner, index) => {
            
            const slide = $('<div>') // Create <div>
                .addClass('banner-slide') // Add class
                .append( // Add image inside
                    $('<img>').attr('src', banner.imageUrl).attr('alt', banner.altText)
                );
            if (index === 0) {
                slide.show(); // Show the first slide initially (CSS also handles this)
            }
            bannerContainer.append(slide); // Add slide to container
        });
        return true; // Indicate success
    }

    // --- NEW: jQuery Slideshow Logic ---
    function startBannerSlideshow() {
        const $slides = $('.banner-slide'); // Get all slides
        if ($slides.length <= 1) return; // Don't start slideshow if 0 or 1 slide

        let currentSlideIndex = 0;
        const slideInterval = 4000; // Time per slide in milliseconds (e.g., 4 seconds)

        setInterval(() => {
            const $currentSlide = $slides.eq(currentSlideIndex); // Get current slide jQuery object

            // Calculate next slide index, looping back to 0
            let nextSlideIndex = (currentSlideIndex + 1) % $slides.length;
            const $nextSlide = $slides.eq(nextSlideIndex); // Get next slide jQuery object

            // Fade out current slide and fade in next slide
            $currentSlide.fadeOut(1000); // 1 second fade out
            $nextSlide.fadeIn(1000); // 1 second fade in

            currentSlideIndex = nextSlideIndex; // Update the current index
        }, slideInterval);
    }


    function renderAbout(aboutData) {
         if (!aboutData) {
             contentContainers.about.innerHTML = '<p>Error loading about information.</p>';
             return;
         }
        contentContainers.about.innerHTML = `
            <h2>${aboutData.title}</h2>
            <div>${aboutData.content}</div>
        `;
    }

    function renderMedia(mediaData) {
  const mediaGrid = document.getElementById('media-grid');
  if (!mediaGrid || !mediaData || !mediaData.length) return;

  mediaGrid.innerHTML = ''; // Clear previous

  mediaData.forEach(item => {
    const videoId = extractYouTubeId(item.videoUrl);
    const iframeSrc = `https://www.youtube.com/embed/${videoId}`;

    const card = document.createElement('div');
    card.className = 'media-card';

    card.innerHTML = `
      <iframe src="${iframeSrc}" allowfullscreen></iframe>
      <p>${item.altText}</p>
    `;

    mediaGrid.appendChild(card);
  });
}

// Helper to extract ID from Shorts/normal URLs
function extractYouTubeId(url) {
  const shortsMatch = url.match(/shorts\/([\w-]+)/);
  const normalMatch = url.match(/v=([\w-]+)/);
  return shortsMatch?.[1] || normalMatch?.[1] || '';
}
    function renderCategoryFilters(products) {
        if (!contentContainers.categoryFiltersContainer) return; // Exit if container not found

        const container = contentContainers.categoryFiltersContainer;
        container.innerHTML = ''; // Clear existing buttons

        // Extract unique categories
        const categories = [...new Set(products.map(p => p.category || 'Other'))].sort();

        // Create "All" button
        const allButton = document.createElement('button');
        allButton.classList.add('filter-btn');
        allButton.setAttribute('data-category', 'All');
        allButton.textContent = 'all'; // Or use a local term like '全部'
        if (currentFilterCategory === 'All') {
            allButton.classList.add('active'); // Mark as active initially
        }
        container.appendChild(allButton);

        // Create buttons for each unique category
        categories.forEach(category => {
            const button = document.createElement('button');
            button.classList.add('filter-btn');
            button.setAttribute('data-category', category);
            button.textContent = category; // e.g., "堅果"
            if (currentFilterCategory === category) {
                button.classList.add('active'); // Mark as active if it's the current filter
            }
            container.appendChild(button);
        });
    }

function renderProductGrid(products) {
    const grid = contentContainers.productGrid;
    if (!grid) {
        console.error("Product grid container not found!");
        return;
    }
    grid.innerHTML = ''; // Clear previous products

    const filteredProducts = (currentFilterCategory === 'All')
        ? products
        : products.filter(p => (p.category || 'Other') === currentFilterCategory);

    if (!filteredProducts || filteredProducts.length === 0) {
        grid.innerHTML = '<p>此分類目前沒有商品。</p>'; // "No products found in this category."
        return;
    }

    filteredProducts.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        productDiv.setAttribute('data-product-id', product.id);

        let outOfStockOverlay = ''; // NEW: Variable for the overlay
        console.log("Stock Status: ", product.stock);
        // NEW: Check for stock status
        if (product.stock === 'N') {
            productDiv.classList.add('out-of-stock'); // Add class for styling and click handling
            // Create a visual overlay indicating the item is out of stock
            outOfStockOverlay = '<div class="stock-overlay"><p>補貨中</p></div>'; // "Restocking"
        }

        // Populate the inner HTML, including the overlay if needed
        productDiv.innerHTML = `
            ${outOfStockOverlay}
            <img src="${product.imgUrl}" loading="lazy" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.price}</p>
            ${product.title ? `<p class="product-title">${product.title}</p>` : ''}
        `;
        grid.appendChild(productDiv);
    });
}

async function renderItemDetails(productId) {
    if (!allItemDetails || !Object.keys(allItemDetails).length) {
        allItemDetails = await fetchData('items_test.json');
    }

    const itemData = allItemDetails[productId];
    if (!itemData) {
        mainBody.itemWrapper.innerHTML = `<p>Error: Product details not found for ID ${productId}.</p>`;
        switchView('content');
        return;
    }

    const thumbnails = Array.isArray(itemData.thumbnailUrls)
        ? itemData.thumbnailUrls
        : JSON.parse(itemData.thumbnails || '[]');

    const colors = Array.isArray(itemData.colors)
        ? itemData.colors
        : JSON.parse(itemData.colors || '[]');

    const sizes = (itemData.sizes || itemData.size || '').split(' , ').filter(s => s.trim());
    const stockMatrix = itemData.stock
        .split(';')
        .map(row => row.split('/')); 

    const thumbnailHTML = thumbnails.map(url =>
        `<img class="thumbnail" src="${url}" alt="thumbnail" style="width: 80px; height: 80px; margin: 4px; cursor: pointer;">`
    ).join('');

    // Color dropdown
    const colorDropdownHTML = `
        <label for="colorSelect"><strong>顏色：</strong></label>
        <select id="colorSelect">
            ${colors.map((color, idx) => `<option value="${idx}">${color}</option>`).join('')}
        </select><br><br>`;

    // Size dropdown (initially based on first color)
    const generateSizeOptions = (colorIndex) => {
        return sizes.map((size, idx) => {
            const inStock = stockMatrix[colorIndex][idx] === 'Y';
            return `<option value="${size}" ${inStock ? '' : 'disabled'}>${size}${inStock ? '' : '（無庫存）'}</option>`;
        }).join('');
    };

    const initialSizeOptions = generateSizeOptions(0); // default to first color

    const sizeDropdownHTML = `
        <label for="sizeSelect"><strong>尺寸：</strong></label>
        <select id="sizeSelect">
            ${initialSizeOptions}
        </select><br><br>`;
    const sizesArr = sizes;
    const chestWidths = itemData.chestWidth.split('/'); // ['50','52','54','58']
    const bodyLengths = itemData.bodyLength.split('/'); // ['40','42','44','48']

    const sizeTableHTML = `
        <h3>尺寸表</h3>
        <table class="size-chart" style="width:100%; border-collapse: collapse; margin-bottom: 1em; text-align: center;">
            <thead>
                <tr style="border-bottom: 2px solid #ccc;">
                    <th style="padding: 8px; text-align: left;">尺寸</th>
                    ${sizesArr.map(size => `<th style="padding: 8px;">${size}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 8px; text-align: left;">胸寬 (cm)</td>
                    ${chestWidths.map(val => `<td style="padding: 8px;">${val}</td>`).join('')}
                </tr>
                <tr>
                    <td style="padding: 8px; text-align: left;">衣長 (cm)</td>
                    ${bodyLengths.map(val => `<td style="padding: 8px;">${val}</td>`).join('')}
                </tr>
            </tbody>
        </table>
    `;
    mainBody.itemWrapper.innerHTML = `
        <article class="item-detail">
            <div class="image-gallery">
                <img class="main-image" src="${itemData.imgUrl}" alt="${itemData.name}" style="max-width: 100%; height: auto;">
                <div class="thumbnail-container" style="margin-top: 10px; display: flex; flex-wrap: wrap;">
                    ${thumbnailHTML}
                </div>
            </div>
            <div class="item-info">
                <h2>${itemData.name}</h2>
                <p>${itemData.description}</p>
                ${colorDropdownHTML}
                ${sizeDropdownHTML}
                ${sizeTableHTML}
                ${itemData.specs ? `<ul>${Object.entries(itemData.specs).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}</ul>` : ''}
                <p class="price">${itemData.price}</p>
                <div class="button-row">
                    <button class="add-to-cart-btn" data-product-id="${itemData.id}">加入購物車</button>
                    <button class="back-to-products-btn" style="cursor: pointer;">返回產品頁</button>
                </div>
            </div>
        </article>
    `;

    // Thumbnail click
    const mainImage = mainBody.itemWrapper.querySelector('.main-image');
    mainBody.itemWrapper.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.addEventListener('click', () => {
            mainImage.src = thumb.src;
        });
    });

    // Update size options on color change
    const colorSelect = mainBody.itemWrapper.querySelector('#colorSelect');
    const sizeSelect = mainBody.itemWrapper.querySelector('#sizeSelect');

    colorSelect.addEventListener('change', () => {
    const colorIndex = parseInt(colorSelect.value, 10);

    // Update size dropdown options dynamically
    sizeSelect.innerHTML = '';
    sizes.forEach((size, idx) => {
        const inStock = stockMatrix[colorIndex][idx] === 'Y';
        const option = document.createElement('option');
        option.value = size;
        option.textContent = inStock ? size : `${size}（無庫存）`;
        if (!inStock) option.disabled = true;
        sizeSelect.appendChild(option);
    });
});

    // Back button
    mainBody.itemWrapper.querySelector('.back-to-products-btn')?.addEventListener('click', e => {
        e.preventDefault();
        if (currentView !== 'content') switchView('content');
        document.getElementById('product-container')?.scrollIntoView({ behavior: 'smooth' });
    });
}
function renderItemDetailsT(productId) {
    const itemData = allItemDetails[productId];
    if (!itemData) {
        mainBody.itemWrapper.innerHTML = `<p>Error: Product details not found for ID ${productId}.</p>`;
        switchView('content');
        return;
    }

    const thumbnails = (itemData.thumbnailUrls || [])
        .map(url => `<img class="thumbnail" src="${url}" alt="thumbnail" style="width: 80px; height: 80px; margin: 4px; cursor: pointer;">`)
        .join('');

    // Parse sizes and stock
    const sizes = itemData.sizes ? itemData.size.split(' / ') : [];
    const stockArray = itemData.stock ? itemData.stock.split('/') : [];

    const sizeDropdown = sizes.length && stockArray.length
        ? `<label for="sizeSelect"><strong>尺寸：</strong></label>
           <select id="sizeSelect">
                ${sizes.map((size, idx) => {
                    const inStock = stockArray[idx] === 'Y';
                    return `<option value="${size}" ${inStock ? '' : 'disabled'}>${size}${inStock ? '' : '（無庫存）'}</option>`;
                }).join('')}
            </select>`
        : '';


    mainBody.itemWrapper.innerHTML = `
        <article class="item-detail">
            <div class="image-gallery">
                <img class="main-image" src="${itemData.imgUrl}" alt="${itemData.name}" style="max-width: 100%; height: auto;">
                <div class="thumbnail-container" style="margin-top: 10px; display: flex; flex-wrap: wrap;">
                    ${thumbnails}
                </div>
            </div>
            <div class="item-info">
                <h2>${itemData.name}</h2>
                <p>${itemData.description}</p>
                ${sizeDropdown}
                ${itemData.specs ? `<ul>${Object.entries(itemData.specs).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}</ul>` : ''}
                <p class="price">${itemData.price}</p>
                <div class="button-row">
                    <button class="add-to-cart-btn" data-product-id="${itemData.id}">加入購物車</button>
                    <button class="back-to-products-btn" style="cursor: pointer;">返回產品頁</button>
                </div>
            </div>
        </article>
    `;

    // Thumbnail click = change main image
    const mainImage = mainBody.itemWrapper.querySelector('.main-image');
    const thumbnailImgs = mainBody.itemWrapper.querySelectorAll('.thumbnail');
    thumbnailImgs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            mainImage.src = thumb.src;
        });
    });

    // Back button
    const backBtn = mainBody.itemWrapper.querySelector('.back-to-products-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView !== 'content') switchView('content');
            document.getElementById('product-container')?.scrollIntoView({ behavior: 'smooth' });
        });
    }
}
function renderSideCart() {
    sideCart.itemsContainer.innerHTML = ''; // Clear current items
    if (cart.length === 0) {
        sideCart.itemsContainer.innerHTML = '<p>您的購物車是空的。</p>';
        setTimeout(() => {
            switchView('content');
        }, 1500);
    } else {
        cart.forEach(item => {
            const imgSrc = Array.isArray(item.images) && item.colorIndex >= 0
                ? item.images[item.colorIndex] || item.images[0] // Fallback to first image
                : item.imgUrl;
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('side-cart-item');
            cartItemDiv.setAttribute('data-cart-item-id', item.id);
            cartItemDiv.innerHTML = `
                <img src="${imgSrc}" alt="${item.name}">
                <div class="item-info">
                    <p class="name">${item.name}</p>
                    ${item.color ? `<p class="color">顏色：${item.color}</p>` : ''}
                    ${item.size ? `<p class="size">尺寸：${item.size}</p>` : ''}
                    <p class="price">${item.price}</p>
                    <div class="quantity-control">
                        <button class="decrease-qty-btn" data-product-id="${item.id}" data-size="${item.size || ''}" data-color="${item.color || ''}">➖</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="increase-qty-btn" data-product-id="${item.id}" data-size="${item.size || ''}" data-color="${item.color || ''}">➕</button>
                    </div>
                </div>
                <button class="remove-item-btn" data-product-id="${item.id}" data-size="${item.size || ''}" data-color="${item.color || ''}">刪除</button>
            `;
            sideCart.itemsContainer.appendChild(cartItemDiv);
        });
    }
    // Update total and item count
    sideCart.totalSpan.textContent = calculateTotal();
    navbar.cartItemCountSpan.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    // Show/hide checkout button
    sideCart.checkoutBtn.style.display = cart.length > 0 ? 'block' : 'none';
}

    // --- View Switching ---
    function switchView(viewName) {
        currentView = viewName;
        // Hide all wrappers
        mainBody.contentWrapper.classList.remove('active');
        mainBody.itemWrapper.classList.remove('active');
        mainBody.checkoutWrapper.classList.remove('active');

        // Show the target wrapper
        switch (viewName) {
            case 'content':
                mainBody.contentWrapper.classList.add('active');
                break;
            case 'item':
                mainBody.itemWrapper.classList.add('active');
                break;
            case 'checkout':
                mainBody.checkoutWrapper.classList.add('active');
                break;
        }
         window.scrollTo(0, 0); // Scroll to top on view change
    }

    // --- Cart Logic ---
    function addToCart(productId) {
    const productToAdd = allProductsData.find(p => p.id === productId);
    const itemDetails = allItemDetails[productId];

    if (!productToAdd || !itemDetails) {
        console.error("Cannot add product to cart: Data missing.");
        alert("Sorry, there was an error adding this item.");
        return;
    }

    // Get selected size from the dropdown
    // Get selected size & color
    const sizeSelect  = document.getElementById('sizeSelect');
    const colorSelect = document.getElementById('colorSelect');
    const selectedSize  = sizeSelect  ? sizeSelect.value  : '';
    const selectedColor = colorSelect
     ? colorSelect.options[colorSelect.selectedIndex].text
     : '';
    const selectedColorIndex = colorSelect ? colorSelect.selectedIndex : 0; 

   /* if (!selectedSize || sizeSelect.options[sizeSelect.selectedIndex].disabled) {
        alert("請選擇有庫存的尺寸");
        return;
    }*/

    // Check if the same product with the same size is already in the cart
    const existingCartItemIndex = cart.findIndex(item =>
     item.id    === productId      &&
     item.size  === selectedSize   &&
     item.color === selectedColor
    );
    if (existingCartItemIndex > -1) {
        // Item with same size already in cart, increase quantity
        cart[existingCartItemIndex].quantity += 1;
    } else {
        // Add new item to cart
          cart.push({
          id:    productId,
          name:  productToAdd.name,
          price: productToAdd.price,
          images: itemDetails.thumbnailUrls || JSON.parse(itemDetails.thumbnails || '[]'),
          size:  selectedSize,
          color: selectedColor,
          colorIndex: selectedColorIndex,
          quantity: 1
      });
    }

    console.log("Cart updated:", cart);
    renderSideCart();
}
    /*
    function addToCart(productId) {
        const productToAdd = allProductsData.find(p => p.id === productId);
        const itemDetails = allItemDetails[productId]; // Get details for image etc.

        if (!productToAdd || !itemDetails) {
            console.error("Cannot add product to cart: Data missing.");
            alert("Sorry, there was an error adding this item.");
            return;
        }

        const existingCartItemIndex = cart.findIndex(item => item.id === productId);

        if (existingCartItemIndex > -1) {
            // Item already in cart, increase quantity
            cart[existingCartItemIndex].quantity += 1;
        } else {
            // Add new item to cart
            cart.push({
                id: productId,
                name: productToAdd.name,
                price: productToAdd.price, // Use price from product grid data
                imgUrl: productToAdd.imgUrl, // Use thumbnail for cart
                quantity: 1
            });
        }

        console.log("Cart updated:", cart);
        renderSideCart(); // Update the visual cart display
        // Optional: Briefly open the side cart to show the item was added
        // sideCart.aside.classList.add('open');
        // setTimeout(() => sideCart.aside.classList.remove('open'), 1500); // Auto close after 1.5s
    }
*/
    function removeFromCart(productId, size, color) {
        cart = cart.filter(item =>
            !(item.id === productId &&
            item.size === size  &&
            item.color=== color)
     );
        renderSideCart(); // Update the visual cart display
    }

function calculateTotal(discountPercent = 0) {
    let total = 0;
    
    cart.forEach(item => {
        let price = 0;
        
        // Handle different price formats
        if (typeof item.price === 'number') {
            // If it's already a number, use it directly
            price = item.price;
        } else if (typeof item.price === 'string') {
            // If it's a string, clean it and parse
            const cleanedPrice = item.price.replace(/[^0-9.-]+/g, "");
            price = parseFloat(cleanedPrice);
        }
        
        // Validate the price and quantity before adding to total
        if (!isNaN(price) && price >= 0 && item.quantity > 0) {
            total += price * item.quantity;
        }
    });
    
    // Apply discount if provided
    if (discountPercent > 0) {
        total *= (1 - discountPercent / 100);
    }
    
    return `${total.toFixed(2)}`;
}
    function changeCartQuantity(productId, size, color, changeAmount) {
     const cartItemIndex = cart.findIndex(item =>
       item.id    === productId &&
       item.size  === size      &&
       item.color === color
     );if (cartItemIndex > -1) {
            cart[cartItemIndex].quantity += changeAmount;

            if (cart[cartItemIndex].quantity <= 0) {
                // Remove the item if quantity is zero or less
                cart.splice(cartItemIndex, 1);
            }

            renderSideCart(); // Re-render cart after change
        }
    }
function openLogisticsMap(orderId, ExtraData) {
    //const orderId = window.currentOrderId;
        
    if (!orderId) {
        alert("Order ID 尚未生成，無法開啟門市選擇頁面");
        return;
    }
    
    // Build URL with both orderId and ExtraData parameters
    const params = new URLSearchParams({
        orderId: orderId,
        ExtraData: ExtraData || 'clothshop' // Use provided ExtraData or default fallback
    });
    
    const url = `https://pickup-store-selection-545199463340.asia-east1.run.app?${params.toString()}`;
    window.open(url, "_self");
}

// Global or module-scoped variables for checkout state
let currentShippingCost = 0;
let currentDiscountRate = 0; // Store as percentage, e.g., 5 for 5%

// --- Main Function to Render Checkout Page ---
async function renderCheckoutPage(cartItems) {
    mainBody.checkoutWrapper.innerHTML = ''; // Clear previous content
    window.scrollTo(0, 0);

    // --- Data Retrieval ---
    const storedStoreInfo = JSON.parse(sessionStorage.getItem('selectedStoreInfo'));
    const lineUserId = sessionStorage.getItem('lineUserId');
    const lineUserName = sessionStorage.getItem('lineUserName');
    const lineUserEmail = sessionStorage.getItem('lineUserEmail') || '';
   
    let isMember = false;

      if (lineUserId) {
        const res = await fetch(`https://script.google.com/macros/s/AKfycbzZhiPYkL62ZHeRMi1-RCkVQUodJDe6IR7UvNouwM1bkHmepJAfECA4JF1_HHLn9Zu7Yw/exec?mode=getMemberInfo&lineUserId=${lineUserId}`);
        const data = await res.json();
        if (data.status === 'success') {
          isMember = true;
        }
      }

     console.log("LINE ID and isMember?:  ", lineUserId, isMember);
    // 1. Render Checkout Header (Title "結帳", Login/Member Button)
    //renderCheckoutHeaderDOM(lineUserName);
    
    // 2. Render Ordered Items Summary ("我訂購的商品", list, totals container)
    renderOrderedItemsSummaryDOM(cartItems);

    // 3. Render "Back for More Items" Button
    renderBackToShoppingButtonDOM();

    // 4. Create and Append Checkout Form
    const checkoutFormElement = createCheckoutFormDOM(lineUserName, lineUserEmail, storedStoreInfo);
    mainBody.checkoutWrapper.appendChild(checkoutFormElement);

    // Get a local reference to the shipping select element FROM THE NEWLY CREATED FORM
    // This is used for the initial calculation of shipping cost.
    const localShippingSelectElement = checkoutFormElement.querySelector('#shipping-method');

    // 6. Initial Calculation of Shipping Cost (Moved before step 5 in execution order for clarity)
    // This calculation is based on the initial state of the form,
    // especially the #shipping-method value which createCheckoutFormDOM might have pre-set.
    if (localShippingSelectElement) { // Ensure the element was found
        if (localShippingSelectElement.value === 'seven_eleven') {
            // This implies createCheckoutFormDOM set its value because storedStoreInfo was present
            currentShippingCost = calculateCartTotal() < 1200 ? 70 : 0;
        } else if (localShippingSelectElement.value === 'store_pickup') {
            currentShippingCost = 0;
        } else { // Default for "" (empty value) or other unexpected values
            currentShippingCost = 0;
        }
    } else {
        console.warn('#shipping-method element not found for initial cost calculation in renderCheckoutPage.');
        currentShippingCost = 0; // Fallback if element isn't found
    }
    updateOrderSummaryDisplay(cartItems, currentShippingCost, currentDiscountRate);

    // 5. Initial UI State & Event Listeners
    // This function will set up all event listeners and may call updateOrderSummaryDisplay again
    // if, for example, it restores a discount code from session storage.
    initializeCheckoutFormStateAndListeners(checkoutFormElement, cartItems, storedStoreInfo);

    // Note: The call to updateOrderSummaryDisplay at the end of initializeCheckoutFormStateAndListeners
    // will ensure the display is accurate after all its internal setup, including potential restoration
    // of discount codes which would affect currentDiscountRate.
}

// --- Helper for Top Header: "結帳" Title & Member/Login Button ---
function handleTopUp(amount) {
  // TODO: replace with real top-up call
  alert(`您選擇了儲值 ${amount}`);
}
function renderCheckoutHeaderDOM(lineUserName) {
    const titleRow = document.createElement('div');
    titleRow.className = 'checkout-title-row'; // Add a class for styling
    titleRow.style.display = 'flex';
    titleRow.style.justifyContent = 'space-between';
    titleRow.style.alignItems = 'center';
    titleRow.style.marginBottom = '20px';

    const checkoutTitle = document.createElement('h2');
    checkoutTitle.textContent = '結帳';
    checkoutTitle.style.margin = '0'; // Remove default margin
    titleRow.appendChild(checkoutTitle);

    if (lineUserName) {
        const memberWrapper = document.createElement('div');
        memberWrapper.classList.add('member-dropdown-wrapper');
        memberWrapper.style.position = 'relative'; // For dropdown positioning

        const nameBtn = document.createElement('button');
        nameBtn.textContent = `👤 ${lineUserName} ▾`;
        nameBtn.classList.add('member-name-btn'); // Add class for styling

        const dropdown = document.createElement('div');
        dropdown.classList.add('member-dropdown');
        dropdown.style.display = 'none';
        dropdown.style.position = 'absolute';
        dropdown.style.right = '0';
        dropdown.style.top = '100%';
        dropdown.style.backgroundColor = 'white';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.zIndex = '100';
        dropdown.style.minWidth = '150px';


        const viewOrders = document.createElement('div');
        viewOrders.textContent = '查看訂單';
        viewOrders.className = 'dropdown-item'; // Add class for styling
        viewOrders.addEventListener('click', () => {
            alert('📦 很抱歉, 此功能正在開發中');
            dropdown.style.display = 'none';
        });

        const creditBalance = document.createElement('div');
        creditBalance.textContent = '儲值餘額';
        creditBalance.className = 'dropdown-item';
        creditBalance.addEventListener('click', async () => {
            const lineUserId = sessionStorage.getItem('lineUserId');
            if (!lineUserId) {
                alert('⚠️ 尚未登入 LINE 帳號，請先登入會員');
                dropdown.style.display = 'none';
                return;
            }
            try {
                // Ensure your GAS URL is correct and supports GET with these params
                const res = await fetch(`https://script.google.com/macros/s/AKfycbzZhiPYkL62ZHeRMi1-RCkVQUodJDe6IR7UvNouwM1bkHmepJAfECA4JF1_HHLn9Zu7Yw/exec?mode=getMemberInfo&lineUserId=${lineUserId}`);
                const data = await res.json();
                if (data.status === 'success') {
                    alert(`💰 目前點數餘額：${data.creditBalance}`);
                } else if (data.status === 'not_found') {
                  const goToSignup = confirm('⚠️ 查無此會員資料，是否前往註冊頁面？');
                  if (goToSignup) {
                    window.location.href = 'https://www.mrbean.tw/signup';
                  }
                } else {
                    alert(`❌ 無法取得點數資料：${data.message || '請稍後再試'}`);
                }
            } catch (err) {
                console.error('Error fetching credit balance:', err);
                alert('🚫 發生錯誤，請檢查網路或稍後再試');
            }
            dropdown.style.display = 'none';
        });
dropdown.appendChild(creditBalance);
  // ─── NEW “儲值” DROPDOWN WITH SCROLLABLE OPTIONS ───
  const topUpWrapper = document.createElement('div');
  topUpWrapper.className = 'dropdown-item topup-wrapper';
  topUpWrapper.style.position = 'relative'; 

  const topUpLabel = document.createElement('div');
  topUpLabel.textContent = '儲值';
  topUpLabel.style.cursor = 'pointer';
  topUpWrapper.appendChild(topUpLabel);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'topup-options';
  Object.assign(optionsContainer.style, {
    display: 'none',
    position: 'absolute',
    top: '100%',
    left: '0',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    maxHeight: '80px',
    overflowY: 'auto',
    width: '100%',
    boxSizing: 'border-box',
    zIndex: '100'
  });

  ['$1000', '$3000', '$5000'].forEach(amount => {
    const opt = document.createElement('div');
    opt.textContent = amount;
    opt.className = 'dropdown-item';
    opt.style.padding = '5px 10px';
    opt.style.cursor = 'pointer';
    opt.addEventListener('click', () => {
      optionsContainer.style.display = 'none';
      dropdown.style.display = 'none';
      handleTopUp(amount);
    });
    optionsContainer.appendChild(opt);
  });

  topUpWrapper.appendChild(optionsContainer);
  dropdown.appendChild(topUpWrapper);

  // show/hide on hover
  topUpLabel.addEventListener('mouseenter', () => {
    optionsContainer.style.display = 'block';
  });
  topUpWrapper.addEventListener('mouseleave', () => {
    optionsContainer.style.display = 'none';
  });

  // ─── end 新增 “儲值” ───
        const logout = document.createElement('div');
        logout.textContent = 'Logout';
        logout.className = 'dropdown-item';
        logout.addEventListener('click', () => {
            sessionStorage.removeItem('lineUserName');
            sessionStorage.removeItem('lineUserEmail');
            sessionStorage.removeItem('lineUserId');
            localStorage.removeItem('cart');
            localStorage.removeItem('currentOrderId');
          //  sessionStorage.removeItem('selectedStoreInfo');
          //  sessionStorage.removeItem('discountCode');
          //  sessionStorage.removeItem('discountTier');
            alert('已登出，購物車及部分結帳資訊已清除。');
            window.location.reload();
        });

        dropdown.appendChild(viewOrders);
        dropdown.appendChild(creditBalance);
        dropdown.appendChild(logout);

        nameBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent window click from immediately closing
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        memberWrapper.appendChild(nameBtn);
        memberWrapper.appendChild(dropdown);
        titleRow.appendChild(memberWrapper);

        // Close dropdown if clicked outside
        window.addEventListener('click', (e) => {
            if (!memberWrapper.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

    } else {
        const memberLoginBtn = document.createElement('button');
        memberLoginBtn.textContent = '會員登入';
        memberLoginBtn.classList.add('member-login-btn'); // Add class for styling
        memberLoginBtn.addEventListener('click', () => {
            if (typeof loginWithLINE === 'function') {
                loginWithLINE();
            } else {
                console.error('loginWithLINE function is not defined.');
                alert('登入功能暫時無法使用。');
            }
        });
        titleRow.appendChild(memberLoginBtn);
    }
    mainBody.checkoutWrapper.appendChild(titleRow);
}

// --- Helper for "我訂購的商品" Title, List, and Totals Placeholders ---
function renderOrderedItemsSummaryDOM(cartItems) {
    mainBody.checkoutWrapper.innerHTML = '';

    const itemsHeader = document.createElement('h2');
    itemsHeader.textContent = '結帳 -- 感謝您選擇EDGE';
    mainBody.checkoutWrapper.appendChild(itemsHeader);

    const itemsTitle = document.createElement('h3');
    itemsTitle.textContent = '我訂購的商品';
    itemsTitle.style.marginTop = '20px';
    mainBody.checkoutWrapper.appendChild(itemsTitle);

    const listElement = document.createElement('div');
    listElement.className = 'checkout-items-list';

    if (!cartItems || cartItems.length === 0) {
        listElement.innerHTML = '<p>您的購物車是空的。</p>';
    } else {
        cartItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'checkout-item-display';
            itemDiv.style.display = 'flex';
            itemDiv.style.justifyContent = 'space-between';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.padding = '5px 0';

            const imgSrc = Array.isArray(item.images) && item.colorIndex >= 0
                ? item.images[item.colorIndex] || item.images[0]
                : item.imgUrl;

            const sizeLabel = item.size
                ? `<div style="font-size: 0.9em; color: #555;">尺寸：${item.size}</div>`
                : '';

            const colorLabel = item.color
                ? `<div style="font-size: 0.9em; color: #555;">顏色：${item.color}</div>`
                : '';

            itemDiv.innerHTML = `
                <div style="flex-basis: 50%;">
                    <img src="${imgSrc}" alt="${item.name}" style="width:30px; height:30px; margin-right:10px; vertical-align:middle;">
                    <span>${item.name}</span>
                    ${colorLabel}
                    ${sizeLabel}
                </div>
                <span style="flex-basis: 20%; text-align:center;">x ${item.quantity}</span>
                <span style="flex-basis: 30%; text-align:right;">${item.price}</span>
            `;

            listElement.appendChild(itemDiv);
        });
    }

    mainBody.checkoutWrapper.appendChild(listElement);

    const totalsContainer = document.createElement('div');
    totalsContainer.id = 'order-summary-totals';
    totalsContainer.style.marginTop = '15px';
    totalsContainer.style.paddingTop = '15px';
    totalsContainer.style.borderTop = '1px solid #eee';
    totalsContainer.innerHTML = `
        <div id="order-subtotal" style="display:flex; justify-content:space-between;">
            <strong>商品總額:</strong> <span>$0.00</span>
        </div>
        <div id="order-discount" style="display:none; justify-content:space-between; color:green;">
            <strong>折扣:</strong> <span>-$0.00</span>
        </div>
        <div id="order-shipping" style="display:none; justify-content:space-between; color:red;">
            <strong>運費:(滿$1200可免)</strong> <span>$0.00</span>
        </div>
        <div id="order-final-total" style="font-weight:bold; margin-top:10px; display:flex; justify-content:space-between; font-size:1.2em;">
            <strong>總金額:</strong> <span>$0.00</span>
        </div>
    `;

    mainBody.checkoutWrapper.appendChild(totalsContainer);
}

// --- Helper for "繼續購買" (Back for More Items) Button ---
function renderBackToShoppingButtonDOM() {
    const backButton = document.createElement('button');
    backButton.id = 'backForMoreItemsBtn';
    backButton.textContent = '🔙 繼續購買';
    backButton.type = 'button'; // Important for forms
    // Basic styling, can be moved to CSS
    Object.assign(backButton.style, {
        backgroundColor: '#5cb85c', color: 'white', padding: '10px 15px',
        border: 'none', borderRadius: '4px', cursor: 'pointer',
        marginTop: '20px', marginBottom: '20px'
    });

    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof switchView === 'function') {
            switchView('content');
            document.getElementById('product-container')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.error('switchView function is not defined.');
        }
    });
    mainBody.checkoutWrapper.appendChild(backButton);
}

// --- Helper to Create Checkout Form DOM Structure ---
function createCheckoutFormDOM(lineUserName, lineUserEmail, storedStoreInfo) {
    const form = document.createElement('form');
    form.id = 'checkout-form-refactored';

    const storedName = sessionStorage.getItem('lineUserName') || '';
    const storedPhone = ''; // Or retrieve if you store phone number elsewhere

    form.innerHTML = `
        <h4>顧客資訊 及 取貨選項</h4>

        <div class="form-group">
            <label for="discount_code">折扣碼 (選填):</label>
            <div style="display:flex;">
                <input type="text" id="discount_code" name="discount_code" class="form-control" style="flex-grow:1; margin-right:5px;">
                <button type="button" id="apply-discount-btn" class="btn btn-secondary btn-sm">套用</button>
            </div>
            <small id="discount-message" class="form-text"></small>
        </div>

        <div class="form-group">
            <label for="shipping-method">取貨方式:</label>
            <select id="shipping-method" name="shipping_method" class="form-control" required>
                <option value="">請選擇取貨方式</option>
                <option value="store_pickup">來商店取貨</option>
                <option value="seven_eleven">7-11 商店取貨</option>
            </select>
        </div>

        <div id="pickup-store-info-display" class="alert alert-info" style="display:none; margin-top:10px; padding:10px; border:1px solid #bce8f1; border-radius:4px; background-color:#d9edf7;">
            </div>

        <div class="form-group">
            <label for="customer_name">收件人姓名:</label>
            <input type="text" id="customer_name" name="customer_name" class="form-control" value="${storedName}" required>
        </div>
        <div class="form-group">
            <label for="customer_email">Email:</label>
            <input type="email" id="customer_email" name="customer_email" class="form-control" value="${lineUserEmail}" required>
        </div>
        <div class="form-group">
            <label for="customer_phone">電話:</label>
            <input type="tel" id="customer_phone" name="customer_phone" class="form-control" pattern="09[0-9]{8}" value="${storedPhone}" placeholder="例如: 0912345678" required>
        </div>

        <div class="form-group">
            <label for="payment-option">付款方式:</label>
            <select id="payment-option" name="payment_option" class="form-control" required>
                <option value="pay_at_store">到店付款</option>
                <option value="credit_card_ecpay">信用卡付款 (透過第三方支付:綠界 ECPay)</option>
                ${lineUserName ? '<option value="credit_point">💰 會員儲值金付款 </option>' : ''}
            </select>
        </div>

        <div id="submit-area" style="margin-top: 20px;">
            <button type="submit" id="final-submit-btn" class="btn btn-primary btn-lg btn-block" style="display:block; width:100%; padding:10px; font-size:1.2em;">確認訂單</button>
              <div id="credit-card-wrapper" style="display:none; text-align: center;">
                <h4>Please click the credit card</h4>
                <img src="image/creditcard.png" alt="Pay with Credit Card" id="ecpay-credit-card-btn"
                  style="cursor:pointer; max-width:150px;" />
              </div>
        </div>
    `;

    // Apply stored 7-11 info if available (for initial render)
    const storeInfoDiv = form.querySelector('#pickup-store-info-display');
    if (storedStoreInfo && storedStoreInfo.CVSStoreID) {
        storeInfoDiv.innerHTML = `
            <p style="margin:0;"><strong>已選擇 7-11 門市</strong></p>
            <p style="margin:0;">店號: ${storedStoreInfo.CVSStoreID}</p>
            <p style="margin:0;">店名: ${storedStoreInfo.CVSStoreName}</p>
            <p style="margin:0;">地址: ${storedStoreInfo.CVSAddress}</p>
        `;
        storeInfoDiv.style.display = 'block';
        form.querySelector('#shipping-method').value = 'seven_eleven';
    }

    return form;
}

// --- Helper to Update Displayed Order Summary (Subtotal, Discount, Shipping, Total) ---
function updateOrderSummaryDisplay(cartItems, shippingCost, discountPercentage) {
    const subtotal = calculateCartTotal(); // This must return a number
    const discountAmount = subtotal * (discountPercentage / 100);
    const totalAfterDiscount = subtotal - discountAmount;
    const finalTotal = totalAfterDiscount + shippingCost;

    document.querySelector('#order-subtotal span').textContent = `$${subtotal.toFixed(0)}`;

    const discountDiv = document.getElementById('order-discount');
    if (discountAmount > 0) {
        discountDiv.querySelector('span').textContent = `-$${discountAmount.toFixed(1)}`;
        discountDiv.style.display = 'flex';
    } else {
        discountDiv.style.display = 'none';
    }

    const shippingDiv = document.getElementById('order-shipping');
    if (shippingCost > 0) {
        shippingDiv.querySelector('span').textContent = `$${shippingCost.toFixed(0)}`;
        shippingDiv.style.display = 'flex';
    } else {
        shippingDiv.style.display = 'none';
    }

    document.querySelector('#order-final-total span').textContent = `$${finalTotal.toFixed(0)}`;

    // Store numeric values for submission if needed
    sessionStorage.setItem('finalOrderAmountForSubmission', finalTotal.toFixed(0));
    sessionStorage.setItem('orderShippingCostForSubmission', shippingCost.toFixed(0));
    sessionStorage.setItem('orderDiscountAmountForSubmission', discountAmount.toFixed(0));
    sessionStorage.setItem('orderSubtotalForSubmission', subtotal.toFixed(0));
}


// --- Helper for Checkout Form Event Listeners & Initial State Management ---
function initializeCheckoutFormStateAndListeners(form, cartItems, initialStoredStoreInfo) {
    const shippingSelect = form.querySelector('#shipping-method');
    const paymentSelect = form.querySelector('#payment-option');
    const submitButton = form.querySelector('#final-submit-btn');
    //const creditCardImageButton = form.querySelector('#ecpay-credit-card-btn');
    const creditCardImageButton = form.querySelector('#credit-card-wrapper');
    const nameInput = form.querySelector('#customer_name');
    const emailInput = form.querySelector('#customer_email');
    const phoneInput = form.querySelector('#customer_phone');
    const discountInput = form.querySelector('#discount_code');
    const applyDiscountBtn = form.querySelector('#apply-discount-btn');
    const discountMessage = form.querySelector('#discount-message');
    const storeInfoDiv = form.querySelector('#pickup-store-info-display');

    // Initial state for submit buttons
    async function toggleSubmitButtonVisibility() {
    const isValid = validateFormFields();
    const paymentMethod = paymentSelect.value;
    const submitAmount = parseFloat(sessionStorage.getItem('finalOrderAmountForSubmission')) || 0;

    // Default: disable both buttons
    submitButton.disabled = true;
    creditCardImageButton.style.display = 'none';

    if (!isValid) return;

    if (paymentMethod === 'credit_point') {
        const lineUserId = sessionStorage.getItem('lineUserId');
        if (!lineUserId) {
            Swal.fire('⚠️ 未登入會員，無法使用點數付款');
            return;
        }

        try {
            const res = await fetch(`https://script.google.com/macros/s/AKfycbzZhiPYkL62ZHeRMi1-RCkVQUodJDe6IR7UvNouwM1bkHmepJAfECA4JF1_HHLn9Zu7Yw/exec?mode=getMemberInfo&lineUserId=${lineUserId}`);
            const data = await res.json();

            if (data.status === 'success') {
                const creditBalance = parseFloat(data.creditBalance) || 0;
                if (creditBalance >= submitAmount) {
                    submitButton.disabled = false;
                } else {
                    Swal.fire(`❌ 點數不足。目前餘額：${creditBalance}，需支付：${submitAmount}`);
                }
            } else {
                Swal.fire('⚠️ 無法取得會員點數，請稍後再試');
            }
        } catch (err) {
            console.error('點數查詢失敗:', err);
            Swal.fire('🚫 發生錯誤，請稍後再試');
        }
    } else if (paymentMethod === 'credit_card_ecpay') {
        creditCardImageButton.style.display = 'block';
    } else {
        submitButton.disabled = false;
    }
}

function validateCustomerName() {
  const nameField = document.getElementById('customer_name');
  const name = nameField.value.trim();

  // 1) No digits or symbols allowed
  if (/[0-9!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]]/.test(name)) {
    Swal.fire('⚠️ 姓名不能包含數字或符號。請重新輸入。');
    return false;
  }

  // 2) Pure Chinese? (Han script only)
  if (/^[\p{Script=Han}]+$/u.test(name)) {
    if (name.length < 2) {
      Swal.fire('⚠️ 中文姓名應至少兩個字元。請重新輸入。');
      return false;
    }
    return true;
  }

  // 3) Pure English? (letters and spaces only)
  if (/^[A-Za-z\s]+$/.test(name)) {
    const parts = name.split(/\s+/);
    if (parts.length > 2) {
      Swal.fire('⚠️ 英文姓名僅能包含一個空格，例如：John Doe');
      return false;
    }
    // Count letters (no spaces)
    const lettersOnly = name.replace(/\s+/g, '');
    if (lettersOnly.length < 2) {
      Swal.fire('⚠️ 請輸入至少兩個字母的英文姓名。');
      return false;
    }
    return true;
  }

  // 4) Mixed or other scripts: just require >=2 chars
  if ([...name].length < 2) {
    Swal.fire('⚠️ 姓名應至少兩個字元。請重新輸入。');
    return false;
  }
  
  return true;
}
    function validateFormFields() {
        const isShippingSelected = shippingSelect.value !== "";
        const is711StoreSelectedIfApplicable = shippingSelect.value !== 'seven_eleven' || (shippingSelect.value === 'seven_eleven' && sessionStorage.getItem('selectedStoreInfo'));

        return isShippingSelected &&
               is711StoreSelectedIfApplicable &&
               nameInput.value.trim() !== '' &&
               emailInput.checkValidity() && // Built-in email validation
               phoneInput.checkValidity(); // For pattern matching e.g. "09[0-9]{8}"
    }

    // Add event listeners to form fields for validation
    [nameInput, emailInput, phoneInput, shippingSelect, paymentSelect].forEach(el => {
        el.addEventListener('input', toggleSubmitButtonVisibility);
        el.addEventListener('change', toggleSubmitButtonVisibility); // For select elements
    });

shippingSelect.addEventListener('change', () => {
  const selection = shippingSelect.value;
  const currentCartTotal = calculateCartTotal();

  // If user picks 7-11…
  if (selection === 'seven_eleven') {
    const existingStore = JSON.parse(sessionStorage.getItem('selectedStoreInfo'));

    // --- CASE A: No store chosen yet → open map immediately ---
    if (!existingStore || !existingStore.CVSStoreID) {
      // generate new orderId
      const now = new Date();
      const orderId = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}${Math.floor(Math.random()*1000)}`;
      window.currentOrderId = orderId;
      localStorage.setItem('currentOrderId', orderId);
      localStorage.setItem('cart', JSON.stringify(cart));

      sessionStorage.setItem('checkoutFormDataBeforeECPay', JSON.stringify({
        name: nameInput.value, email: emailInput.value, phone: phoneInput.value,
        payment: paymentSelect.value, discountCode: discountInput.value,
        currentDiscountRate: currentDiscountRate
      }));

      openLogisticsMap(orderId);
      return; // stop further processing
    }

    // --- CASE B: Store already chosen → show info + “reselect” button ---
    currentShippingCost = currentCartTotal < 1200 ? 70 : 0;
    storeInfoDiv.innerHTML = `
      <p style="margin:0;"><strong>已選擇 7-11 門市</strong></p>
      <p style="margin:0;">店號: ${existingStore.CVSStoreID}</p>
      <p style="margin:0;">店名: ${existingStore.CVSStoreName}</p>
      <p style="margin:0;">地址: ${existingStore.CVSAddress}</p>
      <button type="button" id="reselect-store-btn" style="margin-top:8px;">🔄 重新選擇門市</button>
    `;
    storeInfoDiv.style.display = 'block';

    // wire up the “reselect” button
    document.getElementById('reselect-store-btn')
      .addEventListener('click', () => {
        sessionStorage.setItem('checkoutFormDataBeforeECPay', JSON.stringify({
          name: nameInput.value,
          email: emailInput.value,
          phone: phoneInput.value,
          payment: paymentSelect.value,
          discountCode: discountInput.value,
          currentDiscountRate: currentDiscountRate
        }));
          // 🔁 Also re-save cart and orderId (in case cart updated)
        const now = new Date();
        const orderId = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}${Math.floor(Math.random()*1000)}`;
          window.currentOrderId = orderId;
          localStorage.setItem('currentOrderId', orderId);
        localStorage.setItem('cart', JSON.stringify(cart));
        // clear previous info, then open map
        sessionStorage.removeItem('selectedStoreInfo');
        shippingSelect.value = 'seven_eleven'; // keep dropdown
        openLogisticsMap(window.currentOrderId);
      });

  } else {
    // other shipping methods
    currentShippingCost = (selection === 'seven_eleven') ? (currentCartTotal < 1200 ? 70 : 0) : 0;
    storeInfoDiv.style.display = 'none';
    storeInfoDiv.innerHTML = '';
  }

  // update totals and button state
  updateOrderSummaryDisplay(cartItems, currentShippingCost, currentDiscountRate);
  toggleSubmitButtonVisibility();
});


    applyDiscountBtn.addEventListener('click', () => {
        const code = discountInput.value.trim();
        if (!code) {
            discountMessage.textContent = '請輸入折扣碼。';
            discountMessage.className = 'form-text text-warning';
            currentDiscountRate = 0; // Reset discount
        } else {
            // membershipData must be loaded and accessible
            const discountPercentage = validateDiscountCode(code); // Expects percentage (e.g., 5 for 5%)
            if (discountPercentage > 0) {
                currentDiscountRate = discountPercentage;
                discountMessage.textContent = `已套用 ${sessionStorage.getItem('discountTier') || ''} 折扣 (${discountPercentage}% off)!`;
                discountMessage.className = 'form-text text-success';
            } else {
                currentDiscountRate = 0; // Reset discount
                discountMessage.textContent = '無效的折扣碼。';
                discountMessage.className = 'form-text text-danger';
            }
        }
        updateOrderSummaryDisplay(cartItems, currentShippingCost, currentDiscountRate);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault(); 
      const submitBtn = document.getElementById('final-submit-btn');
      // Prevent double submission
      if (submitBtn.disabled) return; 
      if (!validateCustomerName()) return;
        submitBtn.disabled = true; // Disable immediately
        submitBtn.textContent = '處理中...';
        
        e.preventDefault();
        if (!validateFormFields()) {
            Swal.fire('請完整填寫表單並選擇有效的取貨方式。');
            return;
        }
const shippingMethodValue = shippingSelect.value; // e.g., 'seven_eleven' or 'store_pickup'
let calculatedAddress = 'N/A'; // Default
let cvsStoreIDValue = null;    // Default
const selectedStoreInfo = JSON.parse(sessionStorage.getItem('selectedStoreInfo')); // May be null

if (shippingMethodValue === 'seven_eleven' && selectedStoreInfo) {
    calculatedAddress = selectedStoreInfo.CVSAddress || '7-11 CVS Address Not Provided';
    cvsStoreIDValue = selectedStoreInfo.CVSStoreID || null;
} else if (shippingMethodValue === 'store_pickup') {
    calculatedAddress = '來商店取貨 ([我的實體店])'; // Replace with your actual store address or a generic note
}
// If you have other shipping methods that provide a typed address, handle them here.

const discountAmount = parseFloat(sessionStorage.getItem('orderDiscountAmountForSubmission')) || 0;
const discountRate = parseFloat(currentDiscountRate) || 0;

// Multiply directly (not divide by 1), then round
const calculatedRewardAmount = parseFloat((discountAmount).toFixed(1)); 

const orderId = generateCustomOrderId();

const orderData = {
  orderId,
  name: nameInput.value,
  email: emailInput.value,
  telephone: phoneInput.value,
  paymentMethod: paymentSelect.value,
  address: calculatedAddress,
  CVSStoreID: cvsStoreIDValue || null,
  discountCode: sessionStorage.getItem('discountCode') || null,

  // ✅ Send as strings (e.g., "$345")
  totalAmount: `$${sessionStorage.getItem('finalOrderAmountForSubmission') || '0'}`,
  rewardAmount: `$${calculatedRewardAmount}`,

  lineUserName: sessionStorage.getItem('lineUserName') || null,
  lineUserId: sessionStorage.getItem('lineUserId') || null,
  cartItems: cart
};

console.log("Order Data for Submission to GAS (New Structure):", JSON.stringify(orderData, null, 2));

        // Send to your Cloud Function or Web App here
        await fetch('https://script.google.com/macros/s/AKfycbz8-LmbE9L_0ebvl5-mN09nWH5bkEGZshaK9HjELxlVqU5rbhk5KTpfdmv9Sn8yeDQ3Bg/exec', {
        method: 'POST',
        mode: "no-cors",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      // Reset state
      cart = [];
      localStorage.removeItem('cart'); 
      localStorage.removeItem('currentOrderId');
      sessionStorage.removeItem('cart')
      renderSideCart();
      switchView('content');
      Swal.fire('✅ 感謝您的訂購!');
        // Clear cart, session storage for checkout, and redirect or show success message
        // cart.length = 0; // Clear the global cart array
        // renderSideCart(); // Update side cart display
        // sessionStorage.removeItem('selectedStoreInfo');
        // sessionStorage.removeItem('discountCode');
        // sessionStorage.removeItem('discountTier');
        // localStorage.removeItem('currentOrderId');
        // switchView('thankyou'); // Or navigate to a thank you page
    });

    creditCardImageButton.addEventListener('click', async () => {
        if (!validateFormFields()) {
            Swal.fire('請完整填寫表單並選擇有效的取貨方式。');
            return;
        }
        creditCardImageButton.style.pointerEvents = 'none';              
              // Show loading indicator
              const loadingDiv = document.createElement('div');
              loadingDiv.id = 'payment-loading';
              loadingDiv.innerHTML = '<p>正在連結綠界(ECPay)處理付款請求......</p>';
              loadingDiv.style.position = 'fixed';
              loadingDiv.style.top = '50%';
              loadingDiv.style.left = '50%';
              loadingDiv.style.transform = 'translate(-50%, -50%)';
              loadingDiv.style.background = 'rgba(255,255,255,0.9)';
              loadingDiv.style.padding = '20px';
              loadingDiv.style.borderRadius = '5px';
              loadingDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
              loadingDiv.style.zIndex = '9999';
              document.body.appendChild(loadingDiv);
        const shippingMethodValue = shippingSelect.value; // e.g., 'seven_eleven' or 'store_pickup'
        let calculatedAddress = 'N/A'; // Default
        let cvsStoreIDValue = null;    // Default
        let pickupOption = "N/A";
  
        const selectedStoreInfo = JSON.parse(sessionStorage.getItem('selectedStoreInfo')); // May be null
        const discountAmount = parseFloat(sessionStorage.getItem('orderDiscountAmountForSubmission')) || 0;
        const calculatedRewardAmount = parseFloat((discountAmount).toFixed(1)); 
        if (shippingMethodValue === 'seven_eleven' && selectedStoreInfo) {
            calculatedAddress = selectedStoreInfo.CVSAddress || '7-11 CVS Address Not Provided';
            cvsStoreIDValue = selectedStoreInfo.CVSStoreID || null;
            pickupOption = "便利商店";
       
        } else if (shippingMethodValue === 'store_pickup') {
            calculatedAddress = '來商店取貨 (In-store pickup at [Your Store Address])'; // Replace with your actual store address or a generic note
        }
        const totalForECPay = parseFloat(sessionStorage.getItem('finalOrderAmountForSubmission'));
        let orderIdForECPay = localStorage.getItem('currentOrderId');

        if (!orderIdForECPay) { // Should ideally always exist if 7-11 was chosen
            const now = new Date();
            orderIdForECPay = `ECP${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${Math.floor(Math.random()*1000)}`;
            localStorage.setItem('currentOrderId', orderIdForECPay);
        }

        const itemNames = cartItems.map(item => `${item.name.substring(0,40)} x${item.quantity}`).join('#').substring(0,190); // ECPay length limits
        const orderId = generateCustomOrderId();
        const orderData = {
          orderId,
          name: nameInput.value,
          email: emailInput.value,
          telephone: phoneInput.value,
          paymentMethod: paymentSelect.value,
          address: calculatedAddress,
          CVSStoreID: cvsStoreIDValue || null,
          discountCode: sessionStorage.getItem('discountCode') || null,

          // ✅ Send as strings (e.g., "$345")
          totalAmount: `$${sessionStorage.getItem('finalOrderAmountForSubmission') || '0'}`,
          rewardAmount: `$${calculatedRewardAmount}`,

          lineUserName: sessionStorage.getItem('lineUserName') || null,
          lineUserId: sessionStorage.getItem('lineUserId') || null,
          cartItems: cart
        };
        const itemsString = Array.isArray(cart)
  ? cartItems.map(item => `${item.name} x${item.quantity}`).join(', ')
  : ''; 

        const ecpayData = {
            orderId,
            name: nameInput.value,
            // MerchantTradeDate: Formatted YYYY/MM/DD HH:MM:SS (Server should generate this ideally)
            totalAmount: sessionStorage.getItem('finalOrderAmountForSubmission') || 0,
            customField1: pickupOption,
            customField2: cvsStoreIDValue || null,
            customField3: nameInput.value,
            customField4: phoneInput.value,
            tradeDesc: 'Order Description', // Replace with your order description
            itemName: itemsString, // Replace with your product name
            returnUrl: 'https://creditcard-paid-message-forwarder-545199463340.europe-west1.run.app', // Replace with your ReturnURL
            clientBackUrl: 'https://the2dge.github.io/clothshop/' 
        };
        console.log("Data for ECPay Credit Card (to be sent to server):", ecpayData);

        // Send to your Cloud Function or Web App here
      await fetch('https://script.google.com/macros/s/AKfycbz8-LmbE9L_0ebvl5-mN09nWH5bkEGZshaK9HjELxlVqU5rbhk5KTpfdmv9Sn8yeDQ3Bg/exec', {
        method: 'POST',
        mode: "no-cors",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });   

    // Reset state
      cart = [];
      localStorage.removeItem('cart'); 
      localStorage.removeItem('currentOrderId');
      sessionStorage.removeItem('cart')
      renderSideCart();
        
          // Send a POST request to the Cloud Function
  fetch('https://ecpay-mrbean-creditcard-payment-545199463340.asia-east1.run.app', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ecpayData)
  }) 
  .then(response => {
    if (!response.ok) {
      // If we get an error response, convert it to text and throw
      return response.text().then(text => {
        throw new Error(`Server responded with ${response.status}: ${text}`);
      });
    }
    return response.text();
  })
  .then(html => {
    // Remove loading indicator
    document.getElementById('payment-loading').remove();
    
    // Replace the current document with the payment form
    document.open();
    document.write(html);
    document.close();
  })
  .catch(error => {
    console.error('Error initiating payment:', error);
    
    // Remove loading indicator
    if (document.getElementById('payment-loading')) {
      document.getElementById('payment-loading').remove();
    }
    
    // Re-enable the button
    document.getElementById('creditCardImage').style.pointerEvents = 'auto';
    
    // Show error message
    Swal.fire('Failed 未能付款。請重試。 Error: ' + error.message);
  });
});

    // Restore form data if returning from ECPay map selection (if it was saved)
    const savedCheckoutData = JSON.parse(sessionStorage.getItem('checkoutFormDataBeforeECPay'));
    if (savedCheckoutData) {
        nameInput.value = savedCheckoutData.name || '';
        emailInput.value = savedCheckoutData.email || '';
        phoneInput.value = savedCheckoutData.phone || '';
        paymentSelect.value = savedCheckoutData.payment || 'pay_at_store';
        if (savedCheckoutData.discountCode) {
            discountInput.value = savedCheckoutData.discountCode;
            // Restore applied discount rate
            currentDiscountRate = savedCheckoutData.currentDiscountRate || 0;
            if (currentDiscountRate > 0) {
                 discountMessage.textContent = `已套用 ${sessionStorage.getItem('discountTier') || ''} 折扣 (${currentDiscountRate}% off)!`;
                 discountMessage.className = 'form-text text-success';
            }
        }
        sessionStorage.removeItem('checkoutFormDataBeforeECPay'); // Clean up
    }

    // Initial call to set button states and summary
    updateOrderSummaryDisplay(cartItems, currentShippingCost, currentDiscountRate);
    toggleSubmitButtonVisibility();
}

// --- Modified ECpayStoreDataBackTransfer ---
// This function is assumed to be called on DOMContentLoaded or when ECPay redirects back.
function ECpayStoreDataBackTransfer() {
    const urlParams = new URLSearchParams(window.location.search);
    const CVSStoreID = urlParams.get('CVSStoreID');
    const CVSStoreName = urlParams.get('CVSStoreName');
    const CVSAddress = urlParams.get('CVSAddress');
    const MerchantTradeNo = urlParams.get('MerchantTradeNo'); // This is the orderId

    // Check if we are on the checkout page by looking for a specific element
    const checkoutFormRefactored = document.getElementById('checkout-form-refactored');
    console.log("CVSStoreID, CVSAddress, OrderID and checkout-form-refactored: ", CVSStoreID, CVSAddress, MerchantTradeNo, checkoutFormRefactored);
    if (CVSStoreID && CVSStoreName && CVSAddress && MerchantTradeNo) {
        const selectedStoreData = { CVSStoreID, CVSStoreName, CVSAddress, MerchantTradeNo };
        sessionStorage.setItem('selectedStoreInfo', JSON.stringify(selectedStoreData));
        // Ensure currentOrderId in localStorage is also updated if it changed (it shouldn't from ECPay map)
        localStorage.setItem('currentOrderId', MerchantTradeNo);

        const storeInfoDiv = document.getElementById('pickup-store-info-display');
        const shippingSelect = document.getElementById('shipping-method');

        if (storeInfoDiv) {
            storeInfoDiv.innerHTML = `
                <p style="margin:0;"><strong>已選擇 7-11 門市</strong></p>
                <p style="margin:0;">店號: ${CVSStoreID}</p>
                <p style="margin:0;">店名: ${CVSStoreName}</p>
                <p style="margin:0;">地址: ${CVSAddress}</p>
            `;
            storeInfoDiv.style.display = 'block';
        }
        if (shippingSelect) {
            shippingSelect.value = 'seven_eleven'; // Pre-select the dropdown
        }

        currentShippingCost = calculateCartTotal() < 1200 ? 70 : 0;

        // Restore other form fields that might have been cleared by navigation
        const savedCheckoutData = JSON.parse(sessionStorage.getItem('checkoutFormDataBeforeECPay'));
        if (savedCheckoutData) {
            document.getElementById('customer_name').value = savedCheckoutData.name || '未填寫完整';
            document.getElementById('customer_email').value = savedCheckoutData.email || '';
            document.getElementById('customer_phone').value = savedCheckoutData.phone || '';
            document.getElementById('payment-option').value = savedCheckoutData.payment || 'pay_at_store';
            if (savedCheckoutData.discountCode) {
                document.getElementById('discount_code').value = savedCheckoutData.discountCode;
                currentDiscountRate = savedCheckoutData.currentDiscountRate || 0; // Restore discount rate
                // Visually update discount message if needed
                if (currentDiscountRate > 0) {
                    const discountMessageEl = document.getElementById('discount-message');
                    discountMessageEl.textContent = `已套用 ${sessionStorage.getItem('discountTier') || ''} 折扣 (${currentDiscountRate}% off)!`;
                    discountMessageEl.className = 'form-text text-success';
                }
            }
            sessionStorage.removeItem('checkoutFormDataBeforeECPay'); // Clean up
        }
        
        // 'cart' must be globally available or passed to updateOrderSummaryDisplay
        updateOrderSummaryDisplay(cart, currentShippingCost, currentDiscountRate);

        // Manually trigger change on shippingSelect to re-validate form and button states
        if (shippingSelect) {
            const event = new Event('change');
            shippingSelect.dispatchEvent(event);
        }
        
        // Clean URL: Remove ECPay parameters to prevent re-processing on refresh.
        // Do this carefully, only if you're sure the state is fully restored.
        // window.history.replaceState({}, document.title, window.location.pathname);
    } else if (checkoutFormRefactored && !CVSStoreID && shippingSelect.value === 'seven_eleven' && !sessionStorage.getItem('selectedStoreInfo')) {
        // If 7-11 is selected but no store info exists (e.g. user refreshed after ECPay redirect without params, or navigated back)
        // and we are on checkout page, prompt to select store or clear selection
        shippingSelect.value = ""; // Reset dropdown
        document.getElementById('pickup-store-info-display').style.display = 'none';
        currentShippingCost = 0;
        updateOrderSummaryDisplay(cart, currentShippingCost, currentDiscountRate);
        Swal.fire("請重新選擇7-11門市，或選擇其他取貨方式。");
         const event = new Event('change');
         shippingSelect.dispatchEvent(event); // Trigger validation
    }
}


// --- Utility: Validate Discount Code ---
// Make sure membershipData is loaded before this is called.
function validateDiscountCode(inputCode) {
    if (!membershipData || membershipData.length === 0) {
        console.warn("Membership data not loaded. Cannot validate discount code.");
        return 0;
    }
    const codeToValidate = inputCode.trim().toLowerCase();
    const member = membershipData.find(m => m.discountCode.toLowerCase() === codeToValidate);

    if (member) {
        sessionStorage.setItem('discountCode', member.discountCode); // Store the actual code used
        sessionStorage.setItem('discountTier', member.tier);
        const tier = member.tier.toLowerCase();
        switch (tier) {
            case '鑽石級': return 10;
            case '金級': return 5;   // 5%
            case '銀級': return 3; // 3%
            case '銅級': return 2; // 1%
            default: return 0;
        }
    } else {
        sessionStorage.removeItem('discountCode');
        sessionStorage.removeItem('discountTier');
        return 0;
    }
}

// --- Utility: Calculate Cart Subtotal (Numeric) ---
// Ensure 'cart' is accessible.
function calculateCartTotal() {
    let total = 0;
    if (!cart || cart.length === 0) return 0;
    
    cart.forEach(item => {
        let price = 0;
        
        // Handle different price formats
        if (typeof item.price === 'number') {
            // If it's already a number, use it directly
            price = item.price;
        } else if (typeof item.price === 'string') {
            // If it's a string, clean it and parse
            const cleanedPrice = item.price.replace(/[^0-9.-]+/g, "");
            price = parseFloat(cleanedPrice);
        }
        
        // Validate the price and quantity before adding to total
        if (!isNaN(price) && price >= 0 && item.quantity > 0) {
            total += price * item.quantity;
        }
    });
    
    return Math.round(total * 100) / 100; // Round to 2 decimal places
}

// --- Assumed globally available functions (you need to ensure these exist) ---
// function loginWithLINE() { /* ... */ }
// function openLogisticsMap(orderId) { /* ... */ }
// function switchView(viewName) { /* ... */ }
// let cart = []; // Global cart variable
// let membershipData = []; // Global membership data

// Call ECpayStoreDataBackTransfer on page load to handle returns from ECPay
document.addEventListener('DOMContentLoaded', () => {
    // Load membership data if not already loaded
    if (typeof loadMembershipData === 'function' && (!membershipData || membershipData.length === 0) ) {
        loadMembershipData().then(() => {
            // Potentially re-render or update parts of checkout if it's already visible
            // and dependent on membershipData (e.g. auto-applying a default discount)
        });
    }
    ECpayStoreDataBackTransfer();
});
    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Navbar Links (Scroll within content view)
        navbar.aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView !== 'content') switchView('content');
            document.getElementById('about-container')?.scrollIntoView({ behavior: 'smooth' });
        });
        navbar.aboutLink_m.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView !== 'content') switchView('content');
            document.getElementById('about-container')?.scrollIntoView({ behavior: 'smooth' });
        });
        navbar.productLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView !== 'content') switchView('content');
            document.getElementById('product-container')?.scrollIntoView({ behavior: 'smooth' });
        });
        navbar.productLink_m.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView !== 'content') switchView('content');
            document.getElementById('product-container')?.scrollIntoView({ behavior: 'smooth' });
        });
        navbar.mediaLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView !== 'content') switchView('content');
            document.getElementById('media-container')?.scrollIntoView({ behavior: 'smooth' });
        });
        navbar.mediaLink_m.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView !== 'content') switchView('content');
            document.getElementById('media-container')?.scrollIntoView({ behavior: 'smooth' });
        });
        navbar.memberLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView !== 'content') switchView('content');
            document.getElementById('membership-container')?.scrollIntoView({ behavior: 'smooth' });
        });
        navbar.memberLink_m.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView !== 'content') switchView('content');
            document.getElementById('membership-container')?.scrollIntoView({ behavior: 'smooth' });
        });
        navbar.contactLink.addEventListener('click', (e) => {
            e.preventDefault();
             // Assuming contact scrolls to footer
            document.querySelector('.footer')?.scrollIntoView({ behavior: 'smooth' });
        });
        navbar.contactLink_m.addEventListener('click', (e) => {
            e.preventDefault();
             // Assuming contact scrolls to footer
            document.querySelector('.footer')?.scrollIntoView({ behavior: 'smooth' });
        });
        

        //Listener for Category Filter Button
        if (contentContainers.categoryFiltersContainer) {
            contentContainers.categoryFiltersContainer.addEventListener('click', (e) => {
                const categoryButton = e.target.closest('.category-btn');
                    if (categoryButton) {
                        const selectedCategory = categoryButton.dataset.category;

                        if (selectedCategory !== currentFilterCategory) {
                            currentFilterCategory = selectedCategory;

                            contentContainers.categoryFiltersContainer.querySelectorAll('.category-btn').forEach(btn => {
                                btn.classList.remove('active');
                            });
                            categoryButton.classList.add('active'); // Use categoryButton here!

                            renderProductGrid(allProductsData);
                        }
                    }
               
            });
        } else {
             console.warn("Category filters container not found for event listener setup.");
        }
        // Product Item Click (Event Delegation)
        contentContainers.productContainer.addEventListener('click', (e) => {
            const productItem = e.target.closest('.product-item');

            // MODIFIED: Add a check to ensure the item is NOT out of stock before proceeding.
            if (productItem && !productItem.classList.contains('out-of-stock')) {
                const productId = productItem.dataset.productId;
                renderItemDetails(productId); // Render the detail view
                switchView('item');           // Switch to the item view
            }
            // If the item has the 'out-of-stock' class, nothing happens.
        });

         // Add to Cart Click (Event Delegation on item wrapper)
        mainBody.itemWrapper.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                const productId = e.target.dataset.productId;
                addToCart(productId);
                Swal.fire(`${allItemDetails[productId]?.name || 'Item'} 已加入購物車!`); // Simple feedback
            }
        });


        // Cart Icon Click
        navbar.cartIconBtn.addEventListener('click', () => {
            sideCart.aside.classList.toggle('open');
            if (sideCart.aside.classList.contains('open')) {
                renderSideCart(); // Ensure cart is up-to-date when opened
            }
        });

        // Close Cart Button Click
        sideCart.closeBtn.addEventListener('click', () => {
            sideCart.aside.classList.remove('open');
        });

        // Remove Item from Cart Click (Event Delegation)
        sideCart.itemsContainer.addEventListener('click', e => {
          const btn = e.target;
          if (btn.classList.contains('remove-item-btn')) {
            const { productId, size, color } = btn.dataset;
            removeFromCart(productId, size, color);
          }
          if (btn.classList.contains('increase-qty-btn')) {
            const { productId, size, color } = btn.dataset;
            changeCartQuantity(productId, size, color, +1);
          }
          if (btn.classList.contains('decrease-qty-btn')) {
            const { productId, size, color } = btn.dataset;
            changeCartQuantity(productId, size, color, -1);
          }
        });


        // Checkout Button Click (in Side Cart)
        sideCart.checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                renderCheckoutPage(cart); // ⬅️ Pass current cart
                //cart = []; // Clear cart
                renderSideCart(); // Update side cart visually
                switchView('checkout');
                sideCart.aside.classList.remove('open'); // Close side cart
            } else {
                swal("您的購物車是空的, 無法結帳。");
            }
        });
     
    }

    async function exchangeCodeForToken(code) {
      const cloudFunctionURL = 'https://mrbean-website-line-login-545199463340.asia-east1.run.app'; // <-- replace with your real function URL

      try {
        const response = await fetch(`${cloudFunctionURL}?mode=getLineProfile&code=${encodeURIComponent(code)}`);
        const data = await response.json();

        if (data.status === 'success' && data.profile) {
          const { name, email, sub } = data.profile;
          console.log('✅ LINE Login Success:', data.profile);

          // Store in sessionStorage
          sessionStorage.setItem('lineUserName', name);
          sessionStorage.setItem('lineUserEmail', email);
          sessionStorage.setItem('lineUserId', sub);

          updateNavbarWithUserName(name); // Optional UI update
        } else {
          console.warn('LINE profile fetch failed:', data);
        }
      } catch (err) {
        console.error('exchangeCodeForToken error:', err);
      }
    }
    async function submitOrderToWebApp(orderData) {
        try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbz8-LmbE9L_0ebvl5-mN09nWH5bkEGZshaK9HjELxlVqU5rbhk5KTpfdmv9Sn8yeDQ3Bg/exec', {
                method: 'POST',
                mode: "no-cors", // Required for Google Apps Script
                body: JSON.stringify({
                    action: 'saveOrder',
                    orderData: orderData
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const text = await response.text();
            console.log('Order Save Result:', text);

            Swal.fire('✅ 訂單已成功送出！謝謝您的購買！');
        } catch (error) {
            console.error('Failed to submit order:', error);
            Swal.fire('❌ 訂單提交失敗，請稍後再試。');
        }
    }

    function showUserDropdown(displayName) {
      document.getElementById('login-link').style.display = 'none';
      document.getElementById('user-name').textContent = displayName || '會員';
      document.getElementById('user-dropdown').style.display = 'block';
    }

    // Call this after login is confirmed
    const storedUserName = sessionStorage.getItem('lineUserName');
    console.log("LINE user name exit!");
    if (storedUserName) updateNavbarWithUserName(storedUserName);


    // --- Initialization Function ---
/*
async function init() {
    await renderMainContent();      // Step 1: Fast, above-the-fold content
    defer(renderDeferredContent);  // Step 2: Lazy load background tasks
}*/

async function init() {
  await loadMembershipData();

  // Restore cart from localStorage
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    renderSideCart();
  }

  // Handle URL parameters for special cases
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const CVSStoreID = urlParams.get('CVSStoreID');
  const CVSStoreName = urlParams.get('CVSStoreName');
  const CVSAddress = urlParams.get('CVSAddress');

  // Case 1: Returning from LINE login
  if (code) {
    await exchangeCodeForToken(code);
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Restore cart after login (if any)
    const postLoginCart = localStorage.getItem('cart');
    if (postLoginCart) cart = JSON.parse(postLoginCart);
    
    renderMainContent();
    return;
  }

  // Case 2: Returning from 7-11 store selection
  if (CVSStoreID && CVSStoreName && CVSAddress) {
    const storeInfo = { CVSStoreID, CVSStoreName, CVSAddress };
    sessionStorage.setItem('selectedStoreInfo', JSON.stringify(storeInfo));
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Generate order ID if missing
    if (!localStorage.getItem('currentOrderId')) {
      const now = new Date();
      const orderId = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}${Math.floor(Math.random()*1000)}`;
      localStorage.setItem('currentOrderId', orderId);
    }
    
    // Render checkout with stored cart
    renderCheckoutPage(cart);
    ECpayStoreDataBackTransfer(); // Update UI with store info
    return;
  }

  // Case 3: Normal page load
  renderMainContent();
  defer(renderDeferredContent);
}
async function renderMainContent() {
    try {
        const [bannerData, aboutData, productData] = await Promise.all([
            fetchData('banner.json'),
            fetchData('about.json'),
            fetchData('products_test.json'),
        ]);

        const bannerRendered = renderBanner(bannerData);
        renderAbout(aboutData);
        renderProductGrid(productData);
        allProductsData = productData;

        startSlideshowIfReady(bannerRendered);
    } catch (error) {
        console.error("Error rendering main content:", error);
    }
}

function renderDeferredContent() {
    fetchData('media.json').then(renderMedia);
    loadMembershipData();  // Only needed for checkout or discounts
    renderSideCart();      // UI enhancement only
    setupEventListeners(); // DOM event bindings
}

function startSlideshowIfReady(bannerRendered) {
    if (bannerRendered) {
        startBannerSlideshow();
    }
}

// Utility: Use browser idle time or fallback to timeout
function defer(callback) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(callback);
    } else {
        setTimeout(callback, 200);
    }
}
 /*   async function init() {

        // Fetch all necessary data concurrently
        const [bannerData, aboutData,mediaData, productsData, itemDetailsData] = await Promise.all([
            fetchData('banner.json'),
            fetchData('about.json'),
            fetchData('media.json'),
            fetchData('products_test.json'),
            fetchData('items_test.json')
        ]);

        // --- Restore Cart & OrderId from SessionStorage ---
        //const savedCart = sessionStorage.getItem('cart');
        //const savedOrderId = sessionStorage.getItem('currentOrderId');
        // --- Restore Cart & OrderId from Storage ---
        const savedCart = localStorage.getItem('cart');
        const savedOrderId = localStorage.getItem('currentOrderId');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            console.log("Restored cart from session:", cart);
        }

        if (savedOrderId) {
            window.currentOrderId = savedOrderId;
            console.log("Restored orderId from session:", savedOrderId);
        }
        
        // --- Now render ---
        allProductsData = productsData || [];
        allItemDetails = itemDetailsData || {};

        const bannerRendered = renderBanner(bannerData);
        renderAbout(aboutData);
        renderProductGrid(allProductsData);
        renderMedia(mediaData);
        renderSideCart();
        setupEventListeners();

        if (bannerRendered) {
            startBannerSlideshow();
        }

        console.log("E-commerce site initialized.");
        // --- 🟡 Put login + state logic HERE ---
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const CVSStoreID = urlParams.get('CVSStoreID');

    // --- Case 1: Returning from LINE login ---

    if (code) {
    const profile = await exchangeCodeForToken(code);
    console.log("LINE info: ", profile);
          // Update UI
   //document.getElementById("member-login-button").style.display = 'none';
   // document.getElementById('user-dropdown').style.display = 'block';
   // document.getElementById("member-name-display").textContent = profile.displayName || '會員';

    // Optional: save login info to localStorage/session
     localStorage.setItem('lineUser', JSON.stringify(profile));

      const savedCart = localStorage.getItem('cart');
      console.log("Item saved !Return from LINE Login: ", savedCart);
      if (savedCart) cart = JSON.parse(savedCart);
      switchView('content');
      window.history.replaceState({}, document.title, window.location.pathname);
      return; // ✅ exit early
    }

    // --- Case 2: Returning from 7-11 store selection ---
    if (CVSStoreID) {
      console.log("Detected 7-11 store info via CVSStoreID");
      
      // 🟡 Restore cart before rendering
      const savedCart = localStorage.getItem('cart');
      if (savedCart) cart = JSON.parse(savedCart);

      renderCheckoutPage(cart); // store info will be handled inside
      switchView('checkout');
      
      // 🧠 Call the transfer function only to update UI
      ECpayStoreDataBackTransfer(); 
      
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // --- Normal load ---
    switchView('content');
}*/
//END of init()

    // --- Start the application ---
    //await loadMembershipData();
    init();
    ECpayStoreDataBackTransfer();

}); // End DOMContentLoaded
//?MerchantID=3428230&CVSStoreID=261658&CVSStoreName=權金門市&CVSAddress=台北市內湖區金湖路405號1樓&MerchantTradeNo=20250630111009377&ExtraData=clothshop
