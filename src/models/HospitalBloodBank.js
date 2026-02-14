'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class HospitalBloodBank extends Model {
    static associate(models) {
      // No associations for HospitalBloodBank
    }

    /**
     * Get location as GeoJSON
     */
    getLocation() {
      if (!this.location) return null;
      
      // Parse PostGIS geography point
      const match = this.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        return {
          type: 'Point',
          coordinates: [parseFloat(match[1]), parseFloat(match[2])]
        };
      }
      return null;
    }

    /**
     * Set location from coordinates
     */
    setLocation(longitude, latitude) {
      this.location = `POINT(${longitude} ${latitude})`;
    }

    /**
     * Check if blood type is available
     */
    hasBloodType(bloodGroup) {
      if (!this.blood_availability || typeof this.blood_availability !== 'object') {
        return false;
      }
      return this.blood_availability[bloodGroup] === true || 
             this.blood_availability[bloodGroup] > 0;
    }
  }

  HospitalBloodBank.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    hospital_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'hospital_name'
    },
    location: {
      type: DataTypes.GEOGRAPHY('POINT', 4326),
      allowNull: false
    },
    contact_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'contact_number'
    },
    blood_availability: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'blood_availability'
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_updated'
    }
  }, {
    sequelize,
    modelName: 'HospitalBloodBank',
    tableName: 'hospital_blood_banks',
    timestamps: false
  });

  return HospitalBloodBank;
};
