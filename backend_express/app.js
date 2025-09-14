const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const userRoutes = require('./routes/userRoutes');
const userDailyDetailsRoutes = require('./routes/userDailyDetailsRoutes');
const userLogRoutes = require('./routes/userLogRoutes');
const shelfRoutes = require('./routes/shelfRoutes');
const shelfCatRoutes = require('./routes/shelfCatRoutes');
const productRoutes = require('./routes/productRoutes');
const inboundRoutes = require('./routes/inboundRoutes');
const outboundRoutes = require('./routes/outboundRoutes');
const fireRoutes = require('./routes/fireRoutes');
const productDetailRoute = require('./routes/productDetailRoutes');

app.use('/api/users', userRoutes);
app.use('/api/userDailyDetails', userDailyDetailsRoutes);
app.use('/api/userLogs', userLogRoutes);
app.use('/api/shelves', shelfRoutes);
app.use('/api/shelfCats', shelfCatRoutes);
app.use('/api/products', productRoutes);
app.use('/api/productDetails', productDetailRoute);
app.use('/api/inbounds', inboundRoutes);
app.use('/api/outbounds', outboundRoutes);
app.use('/api/fires', fireRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
