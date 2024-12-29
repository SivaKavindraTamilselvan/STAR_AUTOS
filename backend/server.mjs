import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';

const app = express();
const port = 8081;

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

const mongoURI = 'mongodb+srv://sivakavindra:tamilselvan0701@star.kxfox.mongodb.net/?retryWrites=true&w=majority&appName=star';
mongoose
    .connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Database connection error:', error));


const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, required: true },
});

const Counter = mongoose.model('Counter', CounterSchema);

const VehicleSchema = new mongoose.Schema({
    acNumber: { type: Number, unique: true },
    name: { type: String },
    phonenumber: { type: String },
    registernumber: { type: String },
    noofowner: { type: String },
    rcbook: { type: String },
    model: { type: String },
    chassisno: { type: String },
    engineno: { type: String },
    keys: { type: String },
    hp: { type: String },
    financename: { type: String },
    insurance: { type: String },
    insuranceProvider: { type: String },
    policyNumber: { type: String },
    vehicleprovider: { type: String },
    rcownername: { type: String },
    dealername: { type: String },
    dealerphone: { type: String },
    costprice:{type:String},
    spent:{type:String},
    sellingprice:{type:String},
    totalamount:{type:String},
    rcbookfile: { type: String },
    aadharbook: { type: String },
    vehiclephoto: { type: String },
    noc: { type: String },
    insurancecopy: { type: String },
});

VehicleSchema.pre('save', async function (next) {
    const vehicle = this;

    if (vehicle.isNew) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'acNumber' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            vehicle.acNumber = counter.seq;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

app.post(
    '/api/server/addvehicle',
    upload.fields([
        { name: 'rcbookfile', maxCount: 1 },
        { name: 'aadharbook', maxCount: 1 },
        { name: 'vehiclephoto', maxCount: 1 },
        { name: 'noc', maxCount: 1 },
        { name: 'insurancecopy', maxCount: 1 },

    ]),
    async (req, res) => {
        try {
            const vehicleData = req.body;

            if (req.files['rcbookfile']) {
                vehicleData.rcbookfile = req.files['rcbookfile'][0].path;
            }
            if (req.files['aadharbook']) {
                vehicleData.aadharbook = req.files['aadharbook'][0].path;
            }
            if (req.files['vehiclephoto']) {
                vehicleData.vehiclephoto = req.files['vehiclephoto'][0].path;
            }
            if (req.files['noc']) {
                vehicleData.noc = req.files['noc'][0].path;
            }
            if (req.files['insurancecopy']) {
                vehicleData.insurancecopy = req.files['insurancecopy'][0].path;
            }

            const newVehicle = new Vehicle(vehicleData);
            await newVehicle.save();

            res.status(200).json({ message: 'Vehicle added successfully!', vehicle: newVehicle });
        } catch (error) {
            console.error('Error adding vehicle:', error);
            res.status(500).json({ message: 'Failed to add vehicle', error: error.message });
        }
    }
);

app.get('/api/vehicledata', async (req, res) => {
    try {
        const vehicleData = await Vehicle.find(); // Fetch all vehicle data
        res.json(vehicleData); // Send back the fetched data as JSON
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching vehicle data' });
    }
});

app.get('/api/vehicle/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id); // Replace with your model
        if (!vehicle) {
            return res.status(404).send({ message: 'Vehicle not found' });
        }
        res.json(vehicle);
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
});


app.get('/api/server/initialize-counter', async (req, res) => {
    try {
        const existingCounter = await Counter.findById('acNumber');
        if (!existingCounter) {
            const newCounter = new Counter({ _id: 'acNumber', seq: 0 });
            await newCounter.save();
            res.status(200).json({ message: 'Counter initialized!' });
        } else {
            res.status(200).json({ message: 'Counter already exists!' });
        }
    } catch (error) {
        console.error('Error initializing counter:', error);
        res.status(500).json({ message: 'Failed to initialize counter', error: error.message });
    }
});

app.get('/api/server/getLatestAc', async (req, res) => {
    try {
        const latestVehicle = await Vehicle.findOne().sort({ acNumber: -1 });
        const nextAcNumber = latestVehicle ? latestVehicle.acNumber + 1 : 1;
        res.status(200).json({ acNumber: nextAcNumber });
    } catch (error) {
        console.error('Error fetching latest acNumber:', error);
        res.status(500).json({ message: 'Failed to fetch acNumber', error: error.message });
    }
});

app.get('/api/server/search-vehicle', async (req, res) => {
    try {
        const { hp, registernumber } = req.query; 

        const query = {};

        if (hp) {
            query.acNumber = hp;
        }
        if (registernumber) {
            query.registernumber = registernumber; 
        }

        const vehicle = await Vehicle.find(query);

        if (!vehicle) {
            return res.status(404).json({ message: 'Not found' });
        }
        res.status(200).json({ vehicle });
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        res.status(500).json({ message: 'Failed to fetch vehicle', error: error.message });
    }
});


app.put(
    '/api/server/update-vehicle-by-hp/:hp',
    upload.fields([
        { name: 'rcbookfile', maxCount: 1 },
        { name: 'aadharbook', maxCount: 1 },
        { name: 'vehiclephoto', maxCount: 1 },
        { name: 'noc', maxCount: 1 },
        { name: 'insurancecopy', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            console.log('Request Body:', req.body); // Regular form data
            console.log('Uploaded Files:', req.files); // Uploaded files

            // Update vehicle logic here
            const { hp } = req.params;
            const updatedData = req.body;

            // Include file paths in the update data if files are uploaded
            if (req.files['rcbookfile']) {
                updatedData.rcbookfile = req.files['rcbookfile'][0].path;
            }
            if (req.files['aadharbook']) {
                updatedData.aadharbook = req.files['aadharbook'][0].path;
            }
            if (req.files['vehiclephoto']) {
                updatedData.vehiclephoto = req.files['vehiclephoto'][0].path;
            }
            if (req.files['noc']) {
                updatedData.noc = req.files['noc'][0].path;
            }
            if (req.files['insurancecopy']) {
                updatedData.insurancecopy = req.files['insurancecopy'][0].path;
            }

            const updatedVehicle = await Vehicle.findOneAndUpdate(
                { acNumber:hp },
                updatedData,
                { new: true }
            );

            res.status(200).json({
                message: 'Vehicle updated successfully!',
                vehicle: updatedVehicle,
            });
        } catch (error) {
            console.error('Error updating vehicle:', error);
            res.status(500).json({
                message: 'An error occurred while updating the vehicle',
                error: error.message,
            });
        }
    }
);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
