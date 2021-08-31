module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		submissions: {
			type: DataTypes.LIST,
			defaultValue: 0,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};