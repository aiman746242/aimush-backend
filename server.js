const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// CORS completely allow kiya hai taaki file direct open karne par bhi block na ho
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DB_FILE = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) { fs.mkdirSync(UPLOADS_DIR); }

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, UPLOADS_DIR); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

function readDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        const defaultData = {
            products: [
                { id: 1, name: "Premium Phenyl", price: 80, desc: "Aimush Special Floor Cleaner", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400" }
            ],
            orders: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDatabase(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

// Products Get karne ka route
app.get('/api/products', (req, res) => { 
    res.setHeader('Cache-Control', 'no-cache'); // Taaki purana data cache na ho
    res.json(readDatabase().products); 
});

app.post('/api/admin/add-product', upload.single('productImage'), (req, res) => {
    const { name, price, desc } = req.body;
    const db = readDatabase();
    const imagePath = req.file ? `http://localhost:3000/uploads/${req.file.filename}` : "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400";

    const newProduct = { id: db.products.length + 1, name, price: parseInt(price), desc, image: imagePath };
    db.products.push(newProduct);
    writeDatabase(db);
    res.json({ success: true, message: "Product Live On Aimush Enterprises!" });
});

app.post('/api/order', (req, res) => {
    const { name, phone, gpsLocation, address, items, total } = req.body;
    const db = readDatabase();
    
    const newOrder = {
        id: db.orders.length + 1,
        name,
        phone,
        gpsLocation,
        address,
        items,
        total,
        date: new Date().toLocaleString()
    };

    db.orders.push(newOrder);
    writeDatabase(db);
    res.json({ success: true, orderId: newOrder.id });
});

app.get('/api/admin/orders', (req, res) => { res.json(readDatabase().orders); });

app.listen(PORT, () => { console.log(`🚀 Aimush Enterprises Backend Running at http://localhost:${PORT}`); });
