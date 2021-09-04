module.exports = (sequelize, DataTypes) => {
	return sequelize.define('submissions', {
		id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.STRING,
		},
		guild_id: {
			type: DataTypes.STRING,
		},
		char_name: {
			type: DataTypes.STRING,
		},
		char_link: {
			type: DataTypes.STRING,
		},
		approved: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
		},
		approved_by: {
			type: DataTypes.STRING,
		},
	},{ timestamps: true });
};