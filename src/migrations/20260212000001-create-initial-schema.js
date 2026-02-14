'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Enable PostGIS extension
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 18,
          max: 60
        }
      },
      gender: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      mobile_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      mobile_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      blood_group: {
        type: Sequelize.STRING(5),
        allowNull: false
      },
      medical_history: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      notification_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      quiet_hours_start: {
        type: Sequelize.TIME,
        allowNull: true
      },
      quiet_hours_end: {
        type: Sequelize.TIME,
        allowNull: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for users table
    await queryInterface.addIndex('users', ['blood_group']);
    await queryInterface.addIndex('users', ['mobile_number']);
    await queryInterface.addIndex('users', ['is_active']);

    // Create donors table
    await queryInterface.createTable('donors', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      last_donation_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      eligibility_score: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 100.00
      },
      reliability_score: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 50.00
      },
      total_donations: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      completed_donations: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      cancelled_donations: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      location_updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add geography column for current_location using PostGIS
    await queryInterface.sequelize.query(
      'ALTER TABLE donors ADD COLUMN current_location GEOGRAPHY(POINT, 4326);'
    );

    // Add indexes for donors table
    await queryInterface.addIndex('donors', ['user_id']);
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_donors_location ON donors USING GIST(current_location);'
    );

    // Create blood_requests table
    await queryInterface.createTable('blood_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      requester_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      blood_group: {
        type: Sequelize.STRING(5),
        allowNull: false
      },
      urgency_band: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      required_timeframe: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      hospital_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'PENDING'
      },
      is_private: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      emergency_warning: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add geography column for location
    await queryInterface.sequelize.query(
      'ALTER TABLE blood_requests ADD COLUMN location GEOGRAPHY(POINT, 4326) NOT NULL;'
    );

    // Add indexes for blood_requests table
    await queryInterface.addIndex('blood_requests', ['status']);
    await queryInterface.addIndex('blood_requests', ['urgency_band']);
    await queryInterface.addIndex('blood_requests', ['requester_id']);
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_requests_location ON blood_requests USING GIST(location);'
    );

    // Create donor_notifications table
    await queryInterface.createTable('donor_notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'blood_requests',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      donor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'donors',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      sent_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      viewed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      responded_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      response_type: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      timeout_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_expired: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    });

    // Add indexes for donor_notifications table
    await queryInterface.addIndex('donor_notifications', ['donor_id']);
    await queryInterface.addIndex('donor_notifications', ['request_id']);
    await queryInterface.addIndex('donor_notifications', ['is_expired']);

    // Create donation_history table
    await queryInterface.createTable('donation_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'blood_requests',
          key: 'id'
        }
      },
      donor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'donors',
          key: 'id'
        }
      },
      requester_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      donation_type: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    });

    // Add indexes for donation_history table
    await queryInterface.addIndex('donation_history', ['donor_id']);
    await queryInterface.addIndex('donation_history', ['requester_id']);
    await queryInterface.addIndex('donation_history', ['status']);

    // Create hospital_blood_banks table
    await queryInterface.createTable('hospital_blood_banks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      hospital_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      contact_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      blood_availability: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      last_updated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add geography column for location
    await queryInterface.sequelize.query(
      'ALTER TABLE hospital_blood_banks ADD COLUMN location GEOGRAPHY(POINT, 4326) NOT NULL;'
    );

    // Add spatial index for hospital_blood_banks
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_hospitals_location ON hospital_blood_banks USING GIST(location);'
    );

    // Add check constraint for age on users table
    await queryInterface.sequelize.query(
      'ALTER TABLE users ADD CONSTRAINT check_age CHECK (age >= 18 AND age <= 60);'
    );

    // Add check constraint for urgency_band on blood_requests table
    await queryInterface.sequelize.query(
      "ALTER TABLE blood_requests ADD CONSTRAINT check_urgency_band CHECK (urgency_band IN ('RED', 'PINK', 'WHITE'));"
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hospital_blood_banks');
    await queryInterface.dropTable('donation_history');
    await queryInterface.dropTable('donor_notifications');
    await queryInterface.dropTable('blood_requests');
    await queryInterface.dropTable('donors');
    await queryInterface.dropTable('users');
  }
};
