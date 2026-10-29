from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from fastapi import FastAPI, HTTPException, Header,Depends;
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import psycopg2
import secrets
import time

app = FastAPI()
admin_tokens = {}
ADMIN_TOKEN_LIFETIME = 60 * 60 * 8
security = HTTPBearer()
def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    expires_at = admin_tokens.get(token)

    if not expires_at or expires_at < time.time():
        admin_tokens.pop(token, None)
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired admin token"
        )

    return True
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PostgreSQL connection
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)


@app.get("/")
def home():
    return {"message": "Laptop Shop Backend is Working!"}


@app.get("/db-test")
def db_test():
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    result = cursor.fetchone()
    cursor.close()

    return {
        "message": "PostgreSQL Connected Successfully!",
        "result": result[0]
    }

@app.post("/login")
def login(username: str, password: str):

    # Clear any previous failed transaction
    conn.rollback()

    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT admin_id, username
            FROM admins
            WHERE username = %s AND password = %s
            """,
            (username.strip(), password.strip())
        )

        admin = cursor.fetchone()

        if admin:
           token = secrets.token_urlsafe(32)
           admin_tokens[token] = time.time() + ADMIN_TOKEN_LIFETIME

        return {
           "message": "Login Successful",
           "admin_id": admin[0],
           "username": admin[1],
           "token": token
        }

        return {
            "message": "Invalid Username or Password"
        }

    except Exception as e:
        conn.rollback()
        print("Login error:", e)

        return {
            "message": "Login failed"
        }

    finally:
        cursor.close()
        conn.rollback()


@app.post("/laptops",dependencies=[Depends(require_admin)])
def add_laptop(
    brand: str,
    model: str,
    processor: str,
    ram: str,
    storage: str,
    price: float,
    stock_quantity: int
  ):
    cursor = conn.cursor()

    cursor.execute(
        '''
        INSERT INTO laptops
        (brand, model, processor, ram, storage, price, stock_quantity)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING laptop_id
        ''',
        (brand, model, processor, ram, storage, price, stock_quantity)
    )

    laptop_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()

    return {
        "message": "Laptop added successfully",
        "laptop_id": laptop_id
    }
@app.put("/laptops/{laptop_id}", dependencies=[Depends(require_admin)])
def update_laptop(
    laptop_id: int,
    brand: str,
    model: str,
    processor: str,
    ram: str,
    storage: str,
    price: float,
    stock_quantity: int
  ):
    cursor = conn.cursor()

    cursor.execute(
        '''
        UPDATE laptops
        SET brand = %s,
            model = %s,
            processor = %s,
            ram = %s,
            storage = %s,
            price = %s,
            stock_quantity = %s
        WHERE laptop_id = %s
        RETURNING laptop_id
        ''',
        (
            brand,
            model,
            processor,
            ram,
            storage,
            price,
            stock_quantity,
            laptop_id
        )
    )

    result = cursor.fetchone()

    conn.commit()
    cursor.close()

    if result is None:
        return {
            "message": "Laptop not found"
        }

    return {
        "message": "Laptop updated successfully",
        "laptop_id": result[0]
    }

@app.delete("/laptops/{laptop_id}", dependencies=[Depends(require_admin)])
def delete_laptop(laptop_id: int):
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            DELETE FROM laptops
            WHERE laptop_id = %s
            RETURNING laptop_id
            """,
            (laptop_id,)
        )

        result = cursor.fetchone()

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Laptop not found"
            )

        conn.commit()

        return {
            "message": "Laptop deleted successfully",
            "laptop_id": result[0]
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to delete laptop. It may be linked to existing records."
        )

    finally:
        cursor.close()


@app.get("/suppliers")
def get_suppliers():
    cursor = conn.cursor()
    try:
        conn.rollback()

        cursor.execute("""
            SELECT supplier_id, supplier_name
            FROM suppliers
            ORDER BY supplier_name
        """)

        suppliers = cursor.fetchall()
        conn.commit()

        return [
            {
                "supplier_id": row[0],
                "supplier_name": row[1]
            }
            for row in suppliers
        ]

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()


@app.post("/suppliers", dependencies=[Depends(require_admin)])
def add_supplier(
    supplier_name: str,
    phone: str = "",
    email: str = "",
    address: str = ""
):
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO suppliers
                (supplier_name, phone, email, address)
            VALUES (%s, %s, %s, %s)
            RETURNING supplier_id
            """,
            (
                supplier_name.strip(),
                phone.strip() or None,
                email.strip() or None,
                address.strip() or None
            )
        )

        supplier_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "message": "Supplier added successfully",
            "supplier_id": supplier_id
        }

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail="Unable to add supplier. Check the supplier details."
        )

    finally:
        cursor.close()

@app.get("/laptops")
def get_laptops():
    cursor = conn.cursor()
    try:
        conn.rollback()

        cursor.execute("""
            SELECT laptop_id, brand, model, processor, ram,
                   storage, price, stock_quantity
            FROM laptops
            ORDER BY laptop_id
        """)

        laptops = cursor.fetchall()

        return [
            {
                "laptop_id": row[0],
                "brand": row[1],
                "model": row[2],
                "processor": row[3],
                "ram": row[4],
                "storage": row[5],
                "price": row[6],
                "stock_quantity": row[7]
            }
            for row in laptops
        ]

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()

@app.get("/components")
def get_components():
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT component_id, component_name, brand,
                   purchase_price, selling_price, stock_quantity
            FROM components
            ORDER BY component_id
        """)

        rows = cursor.fetchall()

        return [
            {
                "component_id": row[0],
                "component_name": row[1],
                "brand": row[2],
                "purchase_price": float(row[3]),
                "selling_price": float(row[4]),
                "stock_quantity": row[5]
            }
            for row in rows
        ]

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch components"
        )

    finally:
        cursor.close()


@app.post("/components", dependencies=[Depends(require_admin)])
def add_component(
    component_name: str,
    brand: str = "",
    purchase_price: float = 0,
    selling_price: float = 0,
    stock_quantity: int = 0
):
    if not component_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Component name is required"
        )

    if purchase_price < 0 or selling_price < 0 or stock_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Prices and stock cannot be negative"
        )

    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO components
                (component_name, brand, purchase_price,
                 selling_price, stock_quantity)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING component_id
        """, (
            component_name.strip(),
            brand.strip() or None,
            purchase_price,
            selling_price,
            stock_quantity
        ))

        component_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "message": "Component added successfully",
            "component_id": component_id
        }

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to add component"
        )

    finally:
        cursor.close()

@app.get("/accessories")
def get_accessories():
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT accessory_id, accessory_name, brand,
                   purchase_price, selling_price, stock_quantity
            FROM accessories
            ORDER BY accessory_id
        """)

        rows = cursor.fetchall()

        return [
            {
                "accessory_id": row[0],
                "accessory_name": row[1],
                "brand": row[2],
                "purchase_price": float(row[3]),
                "selling_price": float(row[4]),
                "stock_quantity": row[5]
            }
            for row in rows
        ]

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch accessories"
        )

    finally:
        cursor.close()


@app.post("/accessories", dependencies=[Depends(require_admin)])
def add_accessory(
    accessory_name: str,
    brand: str = "",
    purchase_price: float = 0,
    selling_price: float = 0,
    stock_quantity: int = 0
):
    if not accessory_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Accessory name is required"
        )

    if purchase_price < 0 or selling_price < 0 or stock_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Prices and stock cannot be negative"
        )

    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO accessories
                (accessory_name, brand, purchase_price,
                 selling_price, stock_quantity)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING accessory_id
        """, (
            accessory_name.strip(),
            brand.strip() or None,
            purchase_price,
            selling_price,
            stock_quantity
        ))

        accessory_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "message": "Accessory added successfully",
            "accessory_id": accessory_id
        }

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to add accessory"
        )

    finally:
        cursor.close()

@app.post("/component-purchases", dependencies=[Depends(require_admin)])
def add_component_purchase(
    component_id: int,
    supplier_id: int,
    quantity: int,
    purchase_price: float
):
    if quantity <= 0 or purchase_price < 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be positive and price cannot be negative"
        )

    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO component_purchases
                (component_id, supplier_id, quantity, purchase_price)
            VALUES (%s, %s, %s, %s)
            RETURNING purchase_id
        """, (
            component_id,
            supplier_id,
            quantity,
            purchase_price
        ))

        purchase_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "message": "Component purchase added successfully",
            "purchase_id": purchase_id
        }

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail="Unable to add component purchase. Check the component and supplier IDs."
        )

    finally:
        cursor.close()

@app.post("/accessory-purchases", dependencies=[Depends(require_admin)])
def add_accessory_purchase(
    accessory_id: int,
    supplier_id: int,
    quantity: int,
    purchase_price: float
):
    if quantity <= 0 or purchase_price < 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be positive and price cannot be negative"
        )

    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO accessory_purchases
                (accessory_id, supplier_id, quantity, purchase_price)
            VALUES (%s, %s, %s, %s)
            RETURNING purchase_id
        """, (
            accessory_id,
            supplier_id,
            quantity,
            purchase_price
        ))

        purchase_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "message": "Accessory purchase added successfully",
            "purchase_id": purchase_id
        }

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail="Unable to add accessory purchase. Check the accessory and supplier IDs."
        )

    finally:
        cursor.close()

@app.get("/component-purchases")
def get_component_purchases():
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                cp.purchase_id,
                cp.component_id,
                c.component_name,
                cp.supplier_id,
                s.supplier_name,
                cp.quantity,
                cp.purchase_price,
                cp.purchase_date
            FROM component_purchases cp
            JOIN components c ON cp.component_id = c.component_id
            JOIN suppliers s ON cp.supplier_id = s.supplier_id
            ORDER BY cp.purchase_id DESC
        """)
        rows = cursor.fetchall()

        return [
            {
                "purchase_id": row[0],
                "component_id": row[1],
                "component_name": row[2],
                "supplier_id": row[3],
                "supplier_name": row[4],
                "quantity": row[5],
                "purchase_price": float(row[6]),
                "purchase_date": str(row[7])
            }
            for row in rows
        ]
    finally:
        cursor.close()

@app.get("/accessory-purchases")
def get_accessory_purchases():
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                ap.purchase_id,
                ap.accessory_id,
                a.accessory_name,
                ap.supplier_id,
                s.supplier_name,
                ap.quantity,
                ap.purchase_price,
                ap.purchase_date
            FROM accessory_purchases ap
            JOIN accessories a ON ap.accessory_id = a.accessory_id
            JOIN suppliers s ON ap.supplier_id = s.supplier_id
            ORDER BY ap.purchase_id DESC
        """)
        rows = cursor.fetchall()

        return [
            {
                "purchase_id": row[0],
                "accessory_id": row[1],
                "accessory_name": row[2],
                "supplier_id": row[3],
                "supplier_name": row[4],
                "quantity": row[5],
                "purchase_price": float(row[6]),
                "purchase_date": str(row[7])
            }
            for row in rows
        ]
    finally:
        cursor.close()




@app.post("/purchases")
def add_purchase(
    laptop_id: int,
    supplier_id: int,
    quantity: int,
    purchase_price: float
):
    cursor = conn.cursor()

    try:
        conn.rollback()

        cursor.execute(
            """
            INSERT INTO purchases
            (laptop_id, supplier_id, quantity, purchase_price)
            VALUES (%s, %s, %s, %s)
            RETURNING purchase_id
            """,
            (laptop_id, supplier_id, quantity, purchase_price)
        )

        purchase_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "message": "Purchase added successfully",
            "purchase_id": purchase_id
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()

@app.get("/sales", dependencies=[Depends(require_admin)])
def get_sales():
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            s.sale_id,
            c.customer_name,
            c.phone,
            l.brand,
            l.model,
            s.quantity,
            s.selling_price,
            s.sale_date
        FROM sales s
        JOIN customers c
            ON s.customer_id = c.customer_id
        JOIN laptops l
            ON s.laptop_id = l.laptop_id
        ORDER BY s.sale_id DESC
    """)

    sales = cursor.fetchall()
    cursor.close()

    result = []

    for sale in sales:
        result.append({
            "sale_id": sale[0],
            "customer_name": sale[1],
            "phone": sale[2],
            "brand": sale[3],
            "model": sale[4],
            "quantity": sale[5],
            "selling_price": sale[6],
            "sale_date": sale[7]
        })

    return result
@app.post("/orders")
def create_order(
    name: str,
    email: str,
    phone: str,
    address: str,
    laptop_ids: str,
    quantities: str,
    total_amount: float,
    selling_prices: str
):
    cursor = conn.cursor()

    try:
        # 1. Convert laptop IDs, quantities, and selling prices
        laptop_id_list = laptop_ids.split(",")
        quantity_list = quantities.split(",")
        selling_price_list = selling_prices.split(",")

        if not (
            len(laptop_id_list)
            == len(quantity_list)
            == len(selling_price_list)
        ):
            conn.rollback()
            return {"message": "Invalid laptop, quantity, or selling price data"}

        # Check that both lists have the same number of items
        if len(laptop_id_list) != len(quantity_list):
            return {
                "message": "Invalid laptop and quantity data"
            }

        # 2. Check stock for EVERY laptop first
                # 2. Check stock and selling price for EVERY laptop first
        for i in range(len(laptop_id_list)):
            laptop_id = int(laptop_id_list[i])
            quantity = int(quantity_list[i])
            selling_price = float(selling_price_list[i])

            if quantity <= 0:
                conn.rollback()
                return {"message": "Invalid quantity"}

            if selling_price <= 0:
                conn.rollback()
                return {"message": "Selling price must be greater than zero"}

            # Check quantity
            if quantity <= 0:
                return {
                    "message": "Invalid quantity"
                }

            cursor.execute(
                '''
                SELECT stock_quantity
                FROM laptops
                WHERE laptop_id = %s
                ''',
                (laptop_id,)
            )

            stock = cursor.fetchone()

            # Laptop does not exist
            if stock is None:
                conn.rollback()
                return {
                    "message": f"Laptop ID {laptop_id} not found"
                }

            # Not enough stock
            if stock[0] < quantity:
                conn.rollback()
                return {
                    "message":
                    f"Not enough stock for laptop ID {laptop_id}. "
                    f"Available: {stock[0]}, Requested: {quantity}"
                }

        # 3. Save customer
        cursor.execute(
            '''
            INSERT INTO customers
            (customer_name, email, phone, address)
            VALUES (%s, %s, %s, %s)
            RETURNING customer_id
            ''',
            (name, email, phone, address)
        )

        customer_id = cursor.fetchone()[0]

        # 4. Create order
        cursor.execute(
            '''
            INSERT INTO orders
            (customer_id, total_amount)
            VALUES (%s, %s)
            RETURNING order_id
            ''',
                        (
                customer_id,
                sum(
                    float(selling_price_list[i]) * int(quantity_list[i])
                    for i in range(len(selling_price_list))
                )
            )
        )

        order_id = cursor.fetchone()[0]

                # 5. Save every laptop using its actual selling price
        for i in range(len(laptop_id_list)):
            laptop_id = int(laptop_id_list[i])
            quantity = int(quantity_list[i])
            selling_price = float(selling_price_list[i])

            cursor.execute(
                '''
                INSERT INTO order_items
                (order_id, laptop_id, quantity, price)
                VALUES (%s, %s, %s, %s)
                ''',
                (order_id, laptop_id, quantity, selling_price)
            )

            

        # 6. Commit everything
        conn.commit()

        return {
            "message": "Order created successfully",
            "order_id": order_id
        }

    except Exception as error:

        conn.rollback()

        print("Order error:", error)

        return {
            "message": "Order failed",
            "error": str(error)
        }

    finally:
        cursor.close()

@app.get("/dashboard", dependencies=[Depends(require_admin)])
def get_dashboard():
    cursor = conn.cursor()

    try:
        # Clear any failed transaction left by an earlier request
        conn.rollback()

        cursor.execute("SELECT COUNT(*) FROM laptops")
        total_laptops = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COALESCE(SUM(stock_quantity), 0) FROM laptops"
        )
        total_stock = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM orders")
        total_orders = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COALESCE(SUM(quantity * selling_price), 0) FROM sales"
        )
        total_sales = cursor.fetchone()[0]

        conn.commit()

        return {
            "total_laptops": total_laptops,
            "total_stock": total_stock,
            "total_orders": total_orders,
            "total_sales": float(total_sales)
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()

@app.get("/orders", dependencies=[Depends(require_admin)])
def get_orders():
    cursor = conn.cursor()

    cursor.execute(
        '''
        SELECT
            o.order_id,
            c.customer_name,
            c.phone,
            c.email,
            o.total_amount,
            o.order_date,
            json_agg(
                json_build_object(
                    'brand', l.brand,
                    'model', l.model,
                    'quantity', oi.quantity,
                    'price', oi.price
                )
            ) AS items
        FROM orders o
        JOIN customers c
            ON o.customer_id = c.customer_id
        JOIN order_items oi
            ON o.order_id = oi.order_id
        JOIN laptops l
            ON oi.laptop_id = l.laptop_id
        GROUP BY
            o.order_id,
            c.customer_name,
            c.phone,
            c.email,
            o.total_amount,
            o.order_date
        ORDER BY o.order_id DESC
        '''
    )

    orders = cursor.fetchall()
    cursor.close()

    result = []

    for order in orders:
        result.append({
            "order_id": order[0],
            "customer_name": order[1],
            "phone": order[2],
            "email": order[3],
            "total_amount": float(order[4]),
            "order_date": order[5],
            "items": order[6]
        })

    return result