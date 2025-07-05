const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const News = sequelize.define("News", {
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    author: { type: DataTypes.STRING, allowNull: false },
    files: {  // 여러 파일 정보 (배열)
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('files');
        return raw ? JSON.parse(raw) : [];
      },
      set(val) {
        this.setDataValue('files', JSON.stringify(val));
      }
    }
  });
  return News;
};