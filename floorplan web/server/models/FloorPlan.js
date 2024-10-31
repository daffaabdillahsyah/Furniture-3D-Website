class FloorPlan {
    constructor(filePath) {
        this.filePath = filePath;
    }

    async convert2Dto3D() {
        // Kita akan membuat model dinding sederhana
        return {
            type: 'floorplan',
            filePath: this.filePath, // Tambahkan path file di sini
            dimensions: {
                width: 10,
                height: 3, // Tinggi dinding
                depth: 8
            },
            walls: [
                { start: [-5, 0], end: [5, 0] },    // Dinding depan
                { start: [5, 0], end: [5, 8] },     // Dinding kanan
                { start: [5, 8], end: [-5, 8] },    // Dinding belakang
                { start: [-5, 8], end: [-5, 0] }    // Dinding kiri
            ]
        };
    }
}

module.exports = FloorPlan;
