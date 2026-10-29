import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [laptops, setLaptops] = useState([]);
  
const [components, setComponents] = useState([]);
const [accessories, setAccessories] = useState([]);

  const [selectedLaptop, setSelectedLaptop] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showDashboard, setShowDashboard] = useState(false);

  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [dashboard, setDashboard] = useState({
    total_laptops: 0,
    total_stock: 0,
    total_orders: 0,
    total_sales: 0,
  });

  const [newLaptop, setNewLaptop] = useState({
    brand: "",
    model: "",
    processor: "",
    ram: "",
    storage: "",
    price: "",
    stock_quantity: "",
  });

  const [showAddLaptop, setShowAddLaptop] = useState(false);
  const [showEditLaptop, setShowEditLaptop] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [sales, setSales] = useState([]);
  const [orders, setOrders] = useState([]);

  const [purchase, setPurchase] = useState({
  laptop_id: "",
  supplier_id: "",
  quantity: "",
  purchase_price: "",
  });  
  const [newSupplier, setNewSupplier] = useState({
  supplier_name: "",
  phone: "",
  email: "",
  address: "",
  });
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [purchaseCategory, setPurchaseCategory] = useState("Laptops");
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // --------------------------------
  // GET LAPTOPS
  // --------------------------------

  async function loadLaptops() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/laptops"
      );

      const data = await response.json();

      if (response.ok) {
        setLaptops(data);
      }
    } catch (error) {
      console.error("Error fetching laptops:", error);
    }
  }
  
async function loadComponents() {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/components"
    );

    if (!response.ok) {
      throw new Error("Failed to load components");
    }

    const data = await response.json();
    setComponents(data);
  } catch (error) {
    console.error("Error loading components:", error);
  }
}

async function loadAccessories() {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/accessories"
    );

    if (!response.ok) {
      throw new Error("Failed to load accessories");
    }

    const data = await response.json();
    setAccessories(data);
  } catch (error) {
    console.error("Error loading accessories:", error);
  }
}


  // --------------------------------
  // GET DASHBOARD
  // --------------------------------

  async function loadDashboard(token = adminToken) {
  try {
    

    const response = await fetch(
      "http://127.0.0.1:8000/dashboard",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      setDashboard(data);
    } else {
      console.error("Dashboard error:", data.detail);
    }
  } catch (error) {
    console.error("Error fetching dashboard:", error);
  }
}
    async function loadSuppliers() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/suppliers"
      );

      const data = await response.json();

      if (response.ok) {
        setSuppliers(data);
      }
    } catch (error) {
      console.error(
        "Error fetching suppliers:",
        error
      );
    }
  }

  async function loadSales(token = adminToken) {
    try {
      const response = await fetch(
  "http://127.0.0.1:8000/sales",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
      const data = await response.json();

      if (response.ok) {
        setSales(data);
      }
    } catch (error) {
      console.error(
        "Error fetching sales:",
        error
      );
    }
  }

  async function loadOrders(token = adminToken) {
    try {
     const response = await fetch(
  "http://127.0.0.1:8000/orders",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }

  useEffect(() => {
    loadLaptops();
    loadSuppliers();
    loadDashboard();
    loadComponents();
    loadAccessories();

  }, []);

  // --------------------------------
  // FILTER LAPTOPS
  // --------------------------------

  const filteredLaptops = laptops.filter((laptop) => {
    const laptopName = `${laptop.brand} ${laptop.model}`;

    const matchesSearch = laptopName
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" ||
      laptop.brand.toLowerCase() ===
        category.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // --------------------------------
  // ADMIN LOGIN
  // --------------------------------

  async function adminLogin(e) {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (
        response.ok &&
        data.message === "Login Successful"
      ) {
        setAdminToken(data.token);
        window.localStorage.setItem("adminToken", data.token);
        console.log("Login token:", data.token);
        console.log("Saved token:", window.localStorage.getItem("adminToken"));
        setIsAdmin(true);
        setShowDashboard(true);
       
        loadDashboard(data.token);
        loadSales(data.token);
        loadOrders(data.token);

        alert("Admin Login Successful!");
      } else {
        alert("Invalid Username or Password");
      }
    } catch (error) {
      console.error(error);
      alert("Could not connect to backend");
    }
  }

  // --------------------------------
  // SAVE NEW LAPTOP
  // --------------------------------

  async function saveLaptop(e) {
    e.preventDefault();

    try {
      const url =
        `http://127.0.0.1:8000/laptops` +
        `?brand=${encodeURIComponent(newLaptop.brand)}` +
        `&model=${encodeURIComponent(newLaptop.model)}` +
        `&processor=${encodeURIComponent(
          newLaptop.processor
        )}` +
        `&ram=${encodeURIComponent(newLaptop.ram)}` +
        `&storage=${encodeURIComponent(
          newLaptop.storage
        )}` +
        `&price=${encodeURIComponent(newLaptop.price)}` +
        `&stock_quantity=${encodeURIComponent(
          newLaptop.stock_quantity
        )}`;

      const response = await fetch(url, {
          method: "POST",
          headers: {
                Authorization: `Bearer ${adminToken}`,
              },
      });

      const data = await response.json();

      if (response.ok) {
        alert("Laptop added successfully!");

        setShowAddLaptop(false);

        setNewLaptop({
          brand: "",
          model: "",
          processor: "",
          ram: "",
          storage: "",
          price: "",
          stock_quantity: "",
        });

        await loadLaptops();
        await loadDashboard();
      } else {
        console.error(data);
        alert("Failed to add laptop");
      }
    } catch (error) {
      console.error(error);
      alert("Could not connect to backend");
    }
  }

  // --------------------------------
  // UPDATE LAPTOP
  // --------------------------------

  async function updateLaptop(e) {
    e.preventDefault();

    if (!selectedLaptop) {
      return;
    }

    try {
      const url =
        `http://127.0.0.1:8000/laptops/${selectedLaptop.laptop_id}` +
        `?brand=${encodeURIComponent(newLaptop.brand)}` +
        `&model=${encodeURIComponent(newLaptop.model)}` +
        `&processor=${encodeURIComponent(
          newLaptop.processor
        )}` +
        `&ram=${encodeURIComponent(newLaptop.ram)}` +
        `&storage=${encodeURIComponent(
          newLaptop.storage
        )}` +
        `&price=${encodeURIComponent(newLaptop.price)}` +
        `&stock_quantity=${encodeURIComponent(
          newLaptop.stock_quantity
        )}`;
      const response = await fetch(url, {
          method: "PUT",
          headers: {
                  Authorization: `Bearer ${adminToken}`,
          },
      });
      const data = await response.json();

      if (response.ok) {
        alert("Laptop updated successfully!");

        setShowEditLaptop(true);
        setSelectedLaptop(null);

        setNewLaptop({
          brand: "",
          model: "",
          processor: "",
          ram: "",
          storage: "",
          price: "",
          stock_quantity: "",
        });

        await loadLaptops();
        await loadDashboard();
      } else {
        console.error(data);
        alert("Failed to update laptop");
      }
    } catch (error) {
      console.error(error);
      alert("Could not connect to backend");
    }
  }
  
  
async function addPurchase(e) {
  e.preventDefault();

  if (
    !purchase.laptop_id ||
    !purchase.supplier_id ||
    !purchase.quantity ||
    purchase.purchase_price === "" ||
    Number(purchase.quantity) <= 0 ||
    Number(purchase.purchase_price) < 0
  ) {
    alert("Please enter valid purchase details.");
    return;
  }

  const categoryConfig = {
    Laptops: {
      endpoint: "purchases",
      idParam: "laptop_id",
    },
    Components: {
      endpoint: "component-purchases",
      idParam: "component_id",
    },
    Accessories: {
      endpoint: "accessory-purchases",
      idParam: "accessory_id",
    },
  };

  const config = categoryConfig[purchaseCategory];

  if (!config) {
    alert("Invalid purchase category.");
    return;
  }

  try {
    const params = new URLSearchParams({
      [config.idParam]: purchase.laptop_id,
      supplier_id: purchase.supplier_id,
      quantity: purchase.quantity,
      purchase_price: purchase.purchase_price,
    });

    const response = await fetch(
      `http://127.0.0.1:8000/${config.endpoint}?${params}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail || "Failed to add purchase.");
      return;
    }

    alert(`${purchaseCategory} purchase added successfully!`);

    setPurchase({
      laptop_id: "",
      supplier_id: "",
      quantity: "",
      purchase_price: "",
    });

    if (purchaseCategory === "Laptops") {
      await loadLaptops();
    } else if (purchaseCategory === "Components") {
      await loadComponents();
    } else {
      await loadAccessories();
    }

    await loadDashboard();
  } catch (error) {
    console.error(error);
    alert("Could not connect to backend.");
  }
}


  // --------------------------------
  // ADD TO CART
  // --------------------------------

 
function addToCart(laptop) {
  if (Number(laptop.stock_quantity) <= 0) {
    alert("This laptop is out of stock.");
    return;
  }

  const existingItem = cart.find(
    (item) => item.laptop_id === laptop.laptop_id
  );

  if (existingItem) {
    if (
      existingItem.quantity >=
      Number(laptop.stock_quantity)
    ) {
      alert("Maximum available stock reached.");
      return;
    }

    setCart(
      cart.map((item) =>
        item.laptop_id === laptop.laptop_id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  } else {
    setCart([
      ...cart,
      {
        ...laptop,
        quantity: 1,
        selling_price: Number(laptop.price),
      },
    ]);
  }
}

  // --------------------------------
  // INCREASE QUANTITY
  // --------------------------------

  function increaseQuantity(laptopId) {
    const item = cart.find(
      (cartItem) =>
        cartItem.laptop_id === laptopId
    );

    if (!item) {
      return;
    }

    if (
      item.quantity >=
      Number(item.stock_quantity)
    ) {
      alert("Maximum available stock reached.");
      return;
    }

    setCart(
      cart.map((cartItem) =>
        cartItem.laptop_id === laptopId
          ? {
              ...cartItem,
              quantity: cartItem.quantity + 1,
            }
          : cartItem
      )
    );
  }

  // --------------------------------
  // DECREASE QUANTITY
  // --------------------------------

  function decreaseQuantity(laptopId) {
    setCart(
      cart
        .map((item) =>
          item.laptop_id === laptopId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // --------------------------------
  // REMOVE FROM CART
  // --------------------------------

  function removeFromCart(laptopId) {
    setCart(
      cart.filter(
        (item) =>
          item.laptop_id !== laptopId
      )
    );
  }

  // --------------------------------
  // CUSTOMER DETAILS
  // --------------------------------

  function handleCustomerChange(e) {
    const { name, value } = e.target;

    setCustomer({
      ...customer,
      [name]: value,
    });
  }

  // --------------------------------
  // CART COUNT
  // --------------------------------

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  // --------------------------------
  // CART TOTAL
  // --------------------------------

  
const cartTotal = cart.reduce(
  (total, item) =>
    total +
    Number(item.selling_price) *
      item.quantity,
  0
);


  // --------------------------------
  // PLACE ORDER
  // --------------------------------

  async function placeOrder(e) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const laptopIds = cart
      .map((item) => item.laptop_id)
      .join(",");

    const quantities = cart
      .map((item) => item.quantity)
      .join(",");
    const sellingPrices = cart
      .map((item) => item.selling_price)
      .join(",");
    const url =
      `http://127.0.0.1:8000/orders` +
      `?name=${encodeURIComponent(
        customer.name
      )}` +
      `&email=${encodeURIComponent(
        customer.email
      )}` +
      `&phone=${encodeURIComponent(
        customer.phone
      )}` +
      `&address=${encodeURIComponent(
        customer.address
      )}` +
      `&laptop_ids=${encodeURIComponent(
        laptopIds
      )}` +
      `&quantities=${encodeURIComponent(
        quantities
      )}` +
      `&selling_prices=${encodeURIComponent(
        sellingPrices
      )}` +
      `&total_amount=${cartTotal}`;

    try {
      const response = await fetch(url, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setOrderId(data.order_id);
        setOrderPlaced(true);
        setShowCheckout(false);
        setCart([]);

        await loadLaptops();
        await loadDashboard();
        await loadOrders();
        await loadSales();
      } else {
        console.error(data);
        alert("Order failed");
      }
    } catch (error) {
      console.error(error);
      alert("Could not connect to backend");
    }
  }
  
const handleAddSupplier = async (e) => {
  e.preventDefault();

const token = window.localStorage.getItem("adminToken");


  if (!token) {
    alert("Please login as admin first.");
    return;
  }

  try {
    const params = new URLSearchParams({
      supplier_name: newSupplier.supplier_name,
      phone: newSupplier.phone,
      email: newSupplier.email,
      address: newSupplier.address,
    });

    const response = await fetch(
      `http://127.0.0.1:8000/suppliers?${params.toString()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Unable to add supplier.");
    }

    alert("Supplier added successfully!");

    setNewSupplier({
      supplier_name: "",
      phone: "",
      email: "",
      address: "",
    });

    const suppliersResponse = await fetch(
      "http://127.0.0.1:8000/suppliers"
    );

    if (suppliersResponse.ok) {
      const suppliersData = await suppliersResponse.json();
      setSuppliers(suppliersData);
    }
  } catch (error) {
    alert(error.message);
  }
};


  // --------------------------------
  // START UI
  // --------------------------------

  return (
    <div className="app">

      {/* ADMIN LOGIN */}

      {!isAdmin && (
        <div className="admin-login">
          <h2>Admin Login</h2>

          <form onSubmit={adminLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

            <button type="submit">
              Admin Login
            </button>
          </form>
        </div>
      )}

      {/* HEADER */}

      <header>
        <h1>Laptop Shop</h1>

        <p>
          Buy quality laptops at the best price.
        </p>

        <div className="cart-count">
          🛒 Cart: {cartCount}
        </div>
      </header>

      {/* ADMIN DASHBOARD */}

      {showDashboard && isAdmin && (
        <div className="admin-dashboard">

          <h2>Admin Dashboard</h2>

          <div className="dashboard-cards">

            <div className="dashboard-card">
              <h3>💻 Total Laptops</h3>
              <p>
                {dashboard.total_laptops}
              </p>
            </div>

            <div className="dashboard-card">
              <h3>📦 Total Stock</h3>
              <p>
                {dashboard.total_stock}
              </p>
            </div>

            <div className="dashboard-card">
              <h3>🧾 Total Orders</h3>
              <p>
                {dashboard.total_orders}
              </p>
            </div>

            <div className="dashboard-card">
              <h3>💰 Total Sales</h3>

              <p>
                ₹
                {Number(
                  dashboard.total_sales
                ).toLocaleString("en-IN")}
              </p>
            </div>

          </div>

          {/* ADD LAPTOP BUTTON */}

          <button
            className="add-laptop-button"
            onClick={() =>
              setShowAddLaptop(true)
            }
          >
            ➕ Add Laptop
          </button>

          {/* ADD LAPTOP FORM */}

          {showAddLaptop && (
            <div className="add-laptop-form">

              <h2>Add New Laptop</h2>

              <form onSubmit={saveLaptop}>

                <input
                  type="text"
                  placeholder="Brand"
                  value={newLaptop.brand}
                  onChange={(e) =>
                    setNewLaptop({
                      ...newLaptop,
                      brand: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Model"
                  value={newLaptop.model}
                  onChange={(e) =>
                    setNewLaptop({
                      ...newLaptop,
                      model: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Processor"
                  value={
                    newLaptop.processor
                  }
                  onChange={(e) =>
                    setNewLaptop({
                      ...newLaptop,
                      processor:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="RAM"
                  value={newLaptop.ram}
                  onChange={(e) =>
                    setNewLaptop({
                      ...newLaptop,
                      ram: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Storage"
                  value={
                    newLaptop.storage
                  }
                  onChange={(e) =>
                    setNewLaptop({
                      ...newLaptop,
                      storage:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="number"
                  placeholder="Price"
                  value={newLaptop.price}
                  onChange={(e) =>
                    setNewLaptop({
                      ...newLaptop,
                      price: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="number"
                  placeholder="Stock Quantity"
                  value={
                    newLaptop.stock_quantity
                  }
                  onChange={(e) =>
                    setNewLaptop({
                      ...newLaptop,
                      stock_quantity:
                        e.target.value,
                    })
                  }
                  required
                />

                <button type="submit">
                  💾 Save Laptop
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddLaptop(false)
                  }
                >
                  Cancel
                </button>

              </form>
            </div>
          )}

          {/* EDIT LAPTOP FORM */}

          {showEditLaptop && (
              <div className="add-laptop-form">

                <h2>Edit Laptop</h2>

                <form
                  onSubmit={updateLaptop}
                >

                  <input
                    type="text"
                    placeholder="Brand"
                    value={
                      newLaptop.brand
                    }
                    onChange={(e) =>
                      setNewLaptop({
                        ...newLaptop,
                        brand:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Model"
                    value={
                      newLaptop.model
                    }
                    onChange={(e) =>
                      setNewLaptop({
                        ...newLaptop,
                        model:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Processor"
                    value={
                      newLaptop.processor
                    }
                    onChange={(e) =>
                      setNewLaptop({
                        ...newLaptop,
                        processor:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="RAM"
                    value={
                      newLaptop.ram
                    }
                    onChange={(e) =>
                      setNewLaptop({
                        ...newLaptop,
                        ram:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Storage"
                    value={
                      newLaptop.storage
                    }
                    onChange={(e) =>
                      setNewLaptop({
                        ...newLaptop,
                        storage:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="number"
                    placeholder="Price"
                    value={
                      newLaptop.price
                    }
                    onChange={(e) =>
                      setNewLaptop({
                        ...newLaptop,
                        price:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="number"
                    placeholder="Stock Quantity"
                    value={
                      newLaptop.stock_quantity
                    }
                    onChange={(e) =>
                      setNewLaptop({
                        ...newLaptop,
                        stock_quantity:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <button type="submit">
                    💾 Update Laptop
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowEditLaptop(
                        false
                      );

                      setSelectedLaptop(
                        null
                      );
                    }}
                  >
                    Cancel
                  </button>

                </form>
              </div>
            )}
        </div>
      )}

      {/* MAIN */}

      <main>
        {isAdmin && (
  <div className="purchase-section">

    <h2>📦 Purchase Management</h2>
    <div className="category-tabs">
  <button
    type="button"
    className={purchaseCategory === "Laptops" ? "active-tab" : ""}
    onClick={() => setPurchaseCategory("Laptops")}
  >
    💻 Laptops
  </button>

  <button
    type="button"
    className={purchaseCategory === "Components" ? "active-tab" : ""}
    onClick={() => setPurchaseCategory("Components")}
  >
    🔧 Components
  </button>

  <button
    type="button"
    className={purchaseCategory === "Accessories" ? "active-tab" : ""}
    onClick={() => setPurchaseCategory("Accessories")}
  >
    🎧 Accessories
  </button>
</div>

    <form onSubmit={addPurchase}>


{purchaseCategory === "Laptops" ? (
  <div>
    <label>Select Laptop</label>
    <select
      value={purchase.laptop_id}
      onChange={(e) =>
        setPurchase({
          ...purchase,
          laptop_id: e.target.value,
        })
      }
      required
    >
      <option value="">Select Laptop</option>
      {laptops.map((laptop) => (
        <option key={laptop.laptop_id} value={laptop.laptop_id}>
          {laptop.brand} {laptop.model}
        </option>
      ))}
    </select>
  </div>
) : purchaseCategory === "Components" ? (
  <div>
    <label>Select Component</label>
    <select
      value={purchase.laptop_id}
      onChange={(e) =>
        setPurchase({
          ...purchase,
          laptop_id: e.target.value,
        })
      }
      required
    >
      <option value="">Select Component</option>
      {components.map((component) => (
        <option
          key={component.component_id}
          value={component.component_id}
        >
          {component.component_name} — Stock: {component.stock_quantity}
        </option>
      ))}
    </select>
  </div>
) : (
  <div>
    <label>Select Accessory</label>
    <select
      value={purchase.laptop_id}
      onChange={(e) =>
        setPurchase({
          ...purchase,
          laptop_id: e.target.value,
        })
      }
      required
    >
      <option value="">Select Accessory</option>
      {accessories.map((accessory) => (
        <option
          key={accessory.accessory_id}
          value={accessory.accessory_id}
        >
          {accessory.accessory_name} — Stock: {accessory.stock_quantity}
        </option>
      ))}
    </select>
  </div>
)}

      


{/* Supplier */}
<div className="form-group">
  <label>Supplier</label>

  <select
    value={purchase.supplier_id}
    onChange={(e) =>
      setPurchase({
        ...purchase,
        supplier_id: e.target.value,
      })
    }
    required
  >
    <option value="">Select Supplier</option>

    {suppliers.map((supplier) => (
      <option
        key={supplier.supplier_id}
        value={supplier.supplier_id}
      >
        {supplier.supplier_name}
      </option>
    ))}
  </select>
  <button
        type="button"
        onClick={() => setShowSupplierForm(!showSupplierForm)}
      >
         {showSupplierForm ? "Cancel" : "➕ Add New Supplier"}
      </button>
</div>

      

      
{/* Quantity */}
<div className="form-group">
  <label>Quantity</label>

  <input
    type="number"
    min="1"
    value={purchase.quantity}
    onChange={(e) =>
      setPurchase({
        ...purchase,
        quantity: e.target.value,
      })
    }
    required
  />
</div>


      
{/* Purchase Price */}
<div className="form-group">
  <label>Purchase Price</label>

  <input
    type="number"
    min="0"
    value={purchase.purchase_price}
    onChange={(e) =>
      setPurchase({
        ...purchase,
        purchase_price: e.target.value,
      })
    }
    required
  />
</div>


      <button type="submit">
        ➕ Add Purchase
      </button>

    </form>
    
{showSupplierForm && (
  <div className="supplier-section">
    <form onSubmit={handleAddSupplier} className="supplier-form">
      <input
        type="text"
        placeholder="Supplier Name"
        value={newSupplier.supplier_name}
        onChange={(e) =>
          setNewSupplier({
            ...newSupplier,
            supplier_name: e.target.value,
          })
        }
        required
      />

      <input
        type="text"
        placeholder="Phone"
        value={newSupplier.phone}
        onChange={(e) =>
          setNewSupplier({
            ...newSupplier,
            phone: e.target.value,
          })
        }
        required
      />

      <input
        type="email"
        placeholder="Email"
        value={newSupplier.email}
        onChange={(e) =>
          setNewSupplier({
            ...newSupplier,
            email: e.target.value,
          })
        }
      />

      <input
        type="text"
        placeholder="Address"
        value={newSupplier.address}
        onChange={(e) =>
          setNewSupplier({
            ...newSupplier,
            address: e.target.value,
          })
        }
      />

      <button type="submit">💾 Save Supplier</button>
      <button
        type="button"
        onClick={() => setShowSupplierForm(false)}
      >
        Cancel
      </button>
    </form>
  </div>
)}
  </div>
)}  
   {isAdmin && ( 
  <div className="sales-section">
    <h2>💰 Sales Management</h2>

    {sales.length === 0 ? (
      <p>No sales found.</p>
    ) : (
      <div className="sales-table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Laptop</th>
              <th>Qty</th>
              <th>Selling Price</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.sale_id}>
                <td>#{sale.sale_id}</td>
                <td>{sale.customer_name}</td>
                <td>{sale.phone}</td>
                <td>{sale.brand} {sale.model}</td>
                <td>{sale.quantity}</td>
                <td>₹{Number(sale.selling_price).toLocaleString("en-IN")}</td>
                <td>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
  )}
  {isAdmin && (
  <div className="orders-section">
    <h2>📦 Orders Management</h2>

    {orders.length === 0 ? (
      <p>No orders found.</p>
    ) : (
      <div className="sales-table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Order Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_id}>
                <td>#{order.order_id}</td>
                <td>{order.customer_name}</td>
                <td>{order.phone}</td>
                <td>{order.email}</td>
                <td>
                  {Array.isArray(order.items) && order.items.length > 0
                    ? order.items.map((item, index) => (
                        <div key={`${order.order_id}-${index}`}>
                          {item.brand} {item.model} × {item.quantity}
                        </div>
                      ))
                    : "—"}
                </td>
                <td>₹{Number(order.total_amount || 0).toLocaleString("en-IN")}</td>
                <td>{order.order_date ? new Date(order.order_date).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
  )}


<h2>
          Available Laptops
        </h2>

        {/* SEARCH */}

        <div className="search-box">

          <input
            type="text"
            placeholder="Search laptop..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        {/* CATEGORY */}

        <div className="category-box">

          <label>
            Choose Brand:
          </label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >

            <option value="All">
              All Laptops
            </option>

            <option value="Dell">
              Dell
            </option>

            <option value="HP">
              HP
            </option>

            <option value="Lenovo">
              Lenovo
            </option>

            <option value="ASUS">
              ASUS
            </option>

            <option value="Acer">
              Acer
            </option>

            <option value="MSI">
              MSI
            </option>

          </select>

        </div>

        {/* LAPTOP LIST */}

        <div className="laptop-container">

          {filteredLaptops.map(
            (laptop) => (

              <div
                className="laptop-card"
                key={
                  laptop.laptop_id
                }
              >

                <h3>
                  {laptop.brand}{" "}
                  {laptop.model}
                </h3>

                <p>
                  Processor:{" "}
                  {laptop.processor}
                </p>

                <p>
                  RAM: {laptop.ram}
                </p>

                <p>
                  Storage:{" "}
                  {laptop.storage}
                </p>

                <p>
                  Price: ₹
                  {Number(
                    laptop.price
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>

                <p>
                  Stock:{" "}
                  {laptop.stock_quantity}
                </p>

                {/* VIEW DETAILS */}

                <button
                  className="view-button"
                  onClick={() =>
                    setSelectedLaptop(
                      laptop
                    )
                  }
                >
                  View Details
                </button>

                {/* ADMIN EDIT */}

                
{isAdmin && (
  <>
    <button
      className="edit-button"
      onClick={() => {
        setNewLaptop({
          brand: laptop.brand,
          model: laptop.model,
          processor: laptop.processor,
          ram: laptop.ram,
          storage: laptop.storage,
          price: laptop.price,
          stock_quantity: laptop.stock_quantity,
        });

        setSelectedLaptop(laptop);
        setShowEditLaptop(true);
      }}
    >
      ✏️ Edit
    </button>

    <button
      className="delete-button"
      onClick={async () => {
        const confirmed = window.confirm(
          `Are you sure you want to delete ${laptop.brand} ${laptop.model}?`
        );

        if (!confirmed) return;

        try {
          const response = await fetch(
            `http://127.0.0.1:8000/laptops/${laptop.laptop_id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            alert(data.detail || "Unable to delete laptop.");
            return;
          }

          alert("Laptop deleted successfully!");
          await loadLaptops();
          await loadDashboard();
        } catch (error) {
          alert("Could not connect to the backend.");
        }
      }}
    >
      🗑️ Delete
    </button>
  </>
)}


                {/* ADD TO CART */}

                <button
                  className="cart-button"
                  onClick={() =>
                    addToCart(laptop)
                  }
                >
                  🛒 Add to Cart
                </button>

              </div>
            )
          )}

        </div>

        {/* NO RESULTS */}

        {filteredLaptops.length === 0 && (
          <p className="no-results">
            No laptops found.
          </p>
        )}

        {/* LAPTOP DETAILS */}

        {selectedLaptop && (
          <div className="details">

            <h2>
              {selectedLaptop.brand}{" "}
              {selectedLaptop.model}
            </h2>

            <p>
              Brand:{" "}
              {selectedLaptop.brand}
            </p>

            <p>
              Processor:{" "}
              {selectedLaptop.processor}
            </p>

            <p>
              RAM:{" "}
              {selectedLaptop.ram}
            </p>

            <p>
              Storage:{" "}
              {selectedLaptop.storage}
            </p>

            <p>
              Stock:{" "}
              {selectedLaptop.stock_quantity}
            </p>

            <p>
              Display: 15.6 inch
            </p>

            <p>
              Operating System:
              Windows 11
            </p>

            <h3>
              Price: ₹
              {Number(
                selectedLaptop.price
              ).toLocaleString(
                "en-IN"
              )}
            </h3>

          </div>
        )}

        {/* SHOPPING CART */}

        {cart.length > 0 && (
          <div className="cart-section">

            <h2>
              Shopping Cart
            </h2>

            {cart.map((item) => (

              <div
                className="cart-item"
                key={
                  item.laptop_id
                }
              >

                <div>

                  <strong>
                    {item.brand}{" "}
                    {item.model}
                  </strong>

                  
<p>
  Catalogue Price: ₹
  {Number(item.price).toLocaleString("en-IN")}
</p>

<label>
  Actual Selling Price (₹)
  <input
    type="number"
    min="0.01"
    step="0.01"
    value={item.selling_price}
    onChange={(e) => {
      const value = e.target.value;

      setCart(
        cart.map((cartItem) =>
          cartItem.laptop_id === item.laptop_id
            ? {
                ...cartItem,
                selling_price: value,
              }
            : cartItem
        )
      );
    }}
    required
  />
</label>

                </div>

                <div>

                  <button
                    onClick={() =>
                      decreaseQuantity(
                        item.laptop_id
                      )
                    }
                  >
                    −
                  </button>

                  <span>
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      increaseQuantity(
                        item.laptop_id
                      )
                    }
                  >
                    +
                  </button>

                  <button
                    onClick={() =>
                      removeFromCart(
                        item.laptop_id
                      )
                    }
                  >
                    Remove
                  </button>

                </div>

                <strong>
                  ₹
                  {(
                    Number(item.price) *
                    item.quantity
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>
            ))}

            <h3>
              Total: ₹
              {cartTotal.toLocaleString(
                "en-IN"
              )}
            </h3>

            <button
              className="checkout-button"
              onClick={() =>
                setShowCheckout(true)
              }
            >
              🛍️ Checkout
            </button>

          </div>
        )}

        {/* CHECKOUT */}

        {showCheckout && (
          <div className="checkout-section">

            <h2>
              Customer Details
            </h2>

            <form
              onSubmit={placeOrder}
            >

              <input
                type="text"
                name="name"
                placeholder="Customer Name"
                value={
                  customer.name
                }
                onChange={
                  handleCustomerChange
                }
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={
                  customer.email
                }
                onChange={
                  handleCustomerChange
                }
                
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={
                  customer.phone
                }
                onChange={
                  handleCustomerChange
                }
                required
              />

              <textarea
                name="address"
                placeholder="Delivery Address"
                value={
                  customer.address
                }
                onChange={
                  handleCustomerChange
                }
                required
              />

              <button type="submit">
                ✅ Place Order
              </button>

            </form>

          </div>
        )}

        {/* ORDER SUCCESS */}

        {orderPlaced && (
          <div className="order-success">

            <h2>
              🎉 Order Placed
              Successfully!
            </h2>

            <p>
              Thank you,{" "}
              {customer.name}!
            </p>

            <p>
              Your order has been
              received successfully.
            </p>

            <p>
              <strong>
                Order ID: {orderId}
              </strong>
            </p>

          </div>
        )}

      </main>

    </div>
  );
}

export default App;