let label = document.getElementById("label");
let ShoppingCart = document.getElementById("shopping-cart");

let basket = JSON.parse(localStorage.getItem("data")) || [];

let calculation = () => {
  let cartIcon = document.getElementById("cartAmount");
  cartIcon.innerHTML = basket.map((x) => x.item).reduce((x, y) => x + y, 0);
};

calculation();

let generateCartItems = () => {
  if (basket.length !== 0) {
    return (ShoppingCart.innerHTML = basket
      .map((x) => {
        let { id, item } = x;
        let search = shopItemsData.find((y) => y.id === id) || [];
        return `
      <div class="cart-item">
        <img width="100" src=${search.img} alt="" />
        <div class="details">

          <div class="title-price-x">
              <h4 class="title-price">
                <p>${search.name}</p>
                <p class="cart-item-price">$ ${search.price}</p>
              </h4>
              <i onclick="removeItem(${id})" class="bi bi-x-lg"></i>
          </div>

          <div class="buttons">
              <i onclick="decrement(${id})" class="bi bi-dash-lg"></i>
              <div id=${id} class="quantity">${item}</div>
              <i onclick="increment(${id})" class="bi bi-plus-lg"></i>
          </div>

          <h3>$ ${item * search.price}</h3>
        </div>
      </div>
      `;
      })
      .join(""));
  } else {
    ShoppingCart.innerHTML = ``;
    label.innerHTML = `
    <h2>購物車已空</h2>
    <a href="index.html">
      <button class="HomeBtn">Back to home</button>
    </a>
    `;
  }
};

generateCartItems();

let increment = (id) => {
  let selectedItem = id;
  let search = basket.find((x) => x.id === selectedItem.id);

  if (search === undefined) {
    basket.push({
      id: selectedItem.id,
      item: 1,
    });
  } else {
    search.item += 1;
  }

  generateCartItems();
  update(selectedItem.id);
  localStorage.setItem("data", JSON.stringify(basket));
};
let decrement = (id) => {
  let selectedItem = id;
  let search = basket.find((x) => x.id === selectedItem.id);

  if (search === undefined) return;
  else if (search.item === 0) return;
  else {
    search.item -= 1;
  }
  update(selectedItem.id);
  basket = basket.filter((x) => x.item !== 0);
  generateCartItems();
  localStorage.setItem("data", JSON.stringify(basket));
};

let update = (id) => {
  let search = basket.find((x) => x.id === id);
  // console.log(search.item);
  document.getElementById(id).innerHTML = search.item;
  calculation();
  TotalAmount();
};

let removeItem = (id) => {
  let selectedItem = id;
  // console.log(selectedItem.id);
  basket = basket.filter((x) => x.id !== selectedItem.id);
  generateCartItems();
  TotalAmount();
  localStorage.setItem("data", JSON.stringify(basket));
};

let clearCart = () => {
  basket = [];
  generateCartItems();
  localStorage.setItem("data", JSON.stringify(basket));
};
let toCheckout = async () => {
  // Map the basket items into an array of order objects
  let dataToSave = basket.map((x) => {
    let search = shopItemsData.find((y) => y.id === x.id) || {};
    return {
      name: search.name,
      price: search.price,
      quantity: x.item,
      total: x.item * search.price
    };
  });
  
  // Generate orderId based on current date and the number of seconds since midnight.
  // Format: YYYYMMDD_nnnnn
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed in JS
  let day = String(now.getDate()).padStart(2, '0');
  
  // Calculate seconds since midnight
  let midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let secondsSinceMidnight = Math.floor((now - midnight) / 1000);
  // Pad the seconds to ensure a fixed width (adjust length as needed, here 5 digits)
  let secondsPadded = String(secondsSinceMidnight).padStart(5, '0');
  
  let orderId = `${year}${month}${day}_${secondsPadded}`;
  
  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbxo2PQvT5_UghjtIz3q7MTUy2JRBQ0W-kPzAUk8ciqyUxUBH7kNeVrMzqfSlCB3vcqe/exec", {
      method: "POST",
      mode: "no-cors", // Required for Google Apps Script
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        orders: dataToSave,
        timestamp: now.toISOString(),
        orderId: orderId  // Send the orderId along with the order details if needed
      })
    });

    // Since the mode is 'no-cors', we can't access the response.
    // Instead, assume success if no error is thrown.
    alert("Order submitted successfully!");
    window.location.href = `https://the2dge.github.io/clothshop/order/?MerchantTradeNo=${orderId}`;
    
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Failed to save order. Please try again.");
  }
};
let TotalAmount = () => {
  if (basket.length !== 0) {
    let amount = basket
      .map((x) => {
        let { item, id } = x;
        let search = shopItemsData.find((y) => y.id === id) || [];

        return item * search.price;
      })
      .reduce((x, y) => x + y, 0);
    // console.log(amount);
    label.innerHTML = `
    <h2>總金額 : $ ${amount}</h2>
    <button onclick="toCheckout()" class="checkout">結帳</button>
    <button onclick="clearCart()" class="removeAll">清空購物車</button>
    `;
  } else return;
};

TotalAmount();
