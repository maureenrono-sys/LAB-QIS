const { Equipment, Notification } = require('../models');
const { Op } = require('sequelize');

// ADD NEW EQUIPMENT
exports.addEquipment = async (req, res) => {
    try {
        const item = await Equipment.create({ ...req.body, labId: req.user.labId });
        res.status(201).json(item);
    } catch (error) { res.status(400).json({ message: error.message }); }
};

// GET EQUIPMENT BY DEPARTMENT
exports.getDeptEquipment = async (req, res) => {
    try {
        const items = await Equipment.findAll({ 
            where: { labId: req.user.labId, department: req.params.dept } 
        });
        res.json(items);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// CHECK FOR UPCOMING SERVICE REMINDERS
exports.checkServiceReminders = async (req, res) => {
    try {
        const labId = req.user.labId;
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const upcomingService = await Equipment.findAll({
            where: {
                labId,
                nextServiceDate: {
                    [Op.lte]: sevenDaysFromNow,
                    [Op.gt]: new Date()
                }
            }
        });

        for (let item of upcomingService) {
            const existingNotif = await Notification.findOne({
                where: {
                    labId,
                    message: { [Op.like]: `%${item.name}%service%` },
                    isRead: false
                }
            });

            if (!existingNotif) {
                await Notification.create({
                    message: `Maintenance Alert: ${item.name} (SN: ${item.serialNumber}) is due for service on ${item.nextServiceDate.toLocaleDateString()}.`,
                    type: 'Alert',
                    labId
                });
            }
        }
        res.json({ message: "Service checks completed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const { Maintenance } = require('../models');

exports.recordMaintenance = async (req, res) => {
    try {
        const { equipmentId, serviceDate, nextServiceDate, notes, technicianName } = req.body;
        
        // 1. Create the history record
        await Maintenance.create({
            equipmentId,
            serviceDate,
            notes,
            technicianName
        });

        // 2. Automatically update the Equipment's "Next Service Date"
        const equipment = await Equipment.findByPk(equipmentId);
        if (equipment) {
            equipment.lastServiceDate = serviceDate;
            equipment.nextServiceDate = nextServiceDate;
            equipment.status = 'Operational';
            await equipment.save();
        }

        res.status(201).json({ message: "Maintenance history updated and equipment scheduled." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};