let scene, camera, renderer, controls;
let model;
let isModelLoaded = false;

// Tambahkan variabel untuk tracking furniture
let furnitureObjects = new Map(); // Untuk menyimpan semua furniture yang sudah ditambahkan
let selectedFurniture = null; // Untuk furniture yang sedang dipilih/dimove

// Tambahkan variable global untuk tracking
let isUploaded = false;

// Tambahkan variable untuk floor
let floor;

// Tambahkan variable untuk rotation speed
const ROTATION_SPEED = Math.PI / 2; // 90 derajat per keypress

// Tambahkan variable untuk tracking status upload
let currentUploadedFile = null;

// Tambahkan variable untuk tracking status
let isFirstUpload = true;

// Tambahkan fungsi untuk reset dan init controls
function resetAndInitControls() {
    // Hapus controls yang ada jika sudah ada
    if (controls) {
        controls.dispose();
    }
    
    // Inisialisasi ulang controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;
}

// Fungsi untuk inisialisasi scene di dalam upload box
function initScene() {
    const uploadBox = document.querySelector('.upload-box');
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f1e5);

    // Create camera
    const aspect = uploadBox.clientWidth / uploadBox.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);

    // Create renderer dengan shadow
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        preserveDrawingBuffer: true 
    });
    renderer.setSize(uploadBox.clientWidth, uploadBox.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    // Clear upload box content and add renderer
    uploadBox.appendChild(renderer.domElement);

    // Improved lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Tambah directional light dengan shadow
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Tambah point lights di setiap sudut
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5);
    pointLight1.position.set(10, 5, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
    pointLight2.position.set(-10, 5, -10);
    scene.add(pointLight2);

    // Add controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 30;

    // Add grid helper yang lebih terlihat
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x888888);
    scene.add(gridHelper);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
}
// Update event listener untuk file upload
document.getElementById('fileUpload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const formData = new FormData();
        formData.append('floorplan', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        if (data.success) {
            console.log('File uploaded successfully');
            
            // Initialize scene if not already initialized
            if (!scene) {
                initScene();
            }
            
            // Create or update 3D model
            createBasic3DModel(data.modelData);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error uploading file. Please try again.');
    }
});

// Update window resize handler
window.addEventListener('resize', () => {
    if (camera && renderer) {
        const uploadBox = document.querySelector('.upload-box');
        camera.aspect = uploadBox.clientWidth / uploadBox.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(uploadBox.clientWidth, uploadBox.clientHeight);
    }
});

async function createBasic3DModel(modelData) {
    return new Promise((resolve) => {
        // Load texture dari file yang diupload
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(modelData.filePath, (texture) => {
            console.log('Texture loaded successfully');
            
            // Buat plane geometry untuk lantai
            const planeGeometry = new THREE.PlaneGeometry(20, 20);
            const planeMaterial = new THREE.MeshStandardMaterial({ 
                map: texture,
                side: THREE.DoubleSide
            });
            
            // Buat mesh lantai
            floor = new THREE.Mesh(planeGeometry, planeMaterial);
            floor.rotation.x = -Math.PI / 2; // Rotate agar horizontal
            floor.position.y = 0;
            floor.receiveShadow = true;
            
            scene.add(floor);
            
            // Set camera position untuk melihat lantai
            camera.position.set(0, 15, 15);
            camera.lookAt(0, 0, 0);
            
            console.log('Floor created with uploaded texture');
            isModelLoaded = true;
            
            // Show furniture panel setelah model dibuat
            showFurniturePanel();
            
            resolve();
        }, 
        undefined, // onProgress callback
        (error) => {
            console.error('Error loading texture:', error);
            resolve();
        });
    });
}

// Fungsi helper untuk load texture
function loadTexture(path) {
    return new Promise((resolve, reject) => {
        // Debug log
        console.log('Starting texture load for path:', path);
        
        const loader = new THREE.TextureLoader();
        
        // Set cross origin jika diperlukan
        loader.setCrossOrigin('anonymous');
        
        loader.load(
            path,
            (texture) => {
                console.log('Texture loaded successfully');
                resolve(texture);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading texture:', error);
                reject(error);
            }
        );
    });
}

// Tunggu sampai DOM sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', () => {
    const uploadBox = document.querySelector('.upload-box');
    const fileInput = document.getElementById('fileUpload');

    // Initialize scene
    initScene();

    // Attach initial event listeners
    attachEventListeners();
});

// Update fungsi resetModel
function resetModel() {
    console.log('Resetting model...');
    
    // Dispose existing objects
    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }

    // Clear furniture objects
    if (furnitureObjects) {
        furnitureObjects.forEach((object) => {
            scene.remove(object);
        });
        furnitureObjects.clear();
    }
    
    selectedFurniture = null;

    // Re-initialize scene
    initScene();
    initBasicSceneElements();
    
    // Re-initialize controls
    if (controls) {
        controls.dispose();
    }
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;

    // Reset camera position
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);

    // Reset renderer
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.render(scene, camera);
    }

    // Bersihkan furniture panel
    const furniturePanel = document.querySelector('.furniture-panel');
    if (furniturePanel) {
        furniturePanel.style.display = 'none';
        furniturePanel.classList.remove('show');
        const controlsInfos = furniturePanel.querySelectorAll('.controls-info');
        controlsInfos.forEach(info => info.remove());
    }

    // Trigger file input click setelah reset
    setTimeout(() => {
        document.getElementById('fileUpload').click();
    }, 100);

    // Start animation loop again
    animate();
}

// Tambahkan fungsi untuk inisialisasi elemen dasar scene
function initBasicSceneElements() {
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x888888);
    scene.add(gridHelper);

    // Reset camera
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
}

// Update fungsi attachEventListeners menjadi async
async function attachEventListeners() {
    const uploadBox = document.querySelector('.upload-box');
    const fileInput = document.getElementById('fileUpload');

    if (!uploadBox || !fileInput) {
        console.error('Required elements not found');
        return;
    }

    // Langsung tambahkan event listener tanpa clone
    uploadBox.addEventListener('click', (e) => {
        console.log('Upload box clicked');
        if (!isModelLoaded) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', handleFileUpload);
    console.log('Event listeners attached');
}

// Update DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded');
    attachEventListeners(); // Pasang event listener dulu
    // JANGAN initScene di sini, tunggu sampai file diupload
});

// Update fungsi handleFileUpload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const formData = new FormData();
        formData.append('floorplan', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        if (data.success) {
            isModelLoaded = true;
            
            // Update UI
            document.querySelector('.content-wrapper').classList.add('model-loaded');
            const uploadText = document.querySelector('.upload-box p');
            if (uploadText) {
                uploadText.style.display = 'none';
            }

            // Update scene
            await updateFloorTexture(data.modelData);
            
            // Show furniture panel
            const furniturePanel = document.querySelector('.furniture-panel');
            furniturePanel.style.display = 'block';
            setTimeout(() => {
                furniturePanel.classList.add('show');
            }, 100);
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading file: ' + error.message);
    }
}

// Tambahkan fungsi untuk update texture
async function updateFloorTexture(modelData) {
    const textureLoader = new THREE.TextureLoader();
    const texture = await new Promise((resolve, reject) => {
        textureLoader.load(
            modelData.filePath,
            (texture) => resolve(texture),
            undefined,
            (error) => reject(error)
        );
    });

    // Update texture pada floor yang sudah ada
    if (floor && floor.material) {
        if (floor.material.map) {
            floor.material.map.dispose();
        }
        floor.material.map = texture;
        floor.material.needsUpdate = true;
    }
}

function initFurnitureInteractions() {
    const furnitureItems = document.querySelectorAll('.furniture-item');
    console.log(`Found ${furnitureItems.length} furniture items`);

    furnitureItems.forEach(item => {
        // Remove old listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);

        // Add new click listener
        newItem.addEventListener('click', (e) => {
            if (!isModelLoaded) {
                console.log('Model not loaded, cannot add furniture');
                return;
            }

            const type = e.currentTarget.dataset.type;
            console.log(`Adding ${type} to scene`);
            addFurnitureToScene(type, 0, 0);
        });
    });
}

// Update fungsi addFurnitureToScene untuk furniture yang lebih realistis
function addFurnitureToScene(type, x, z) {
    let geometry, material;
    
    switch(type) {
        case 'sofa':
            const sofaGroup = new THREE.Group();
            
            // Base
            const baseMesh = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.4, 1),
                new THREE.MeshStandardMaterial({ color: 0x808080 })
            );
            
            // Back rest
            const backMesh = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.8, 0.3),
                new THREE.MeshStandardMaterial({ color: 0x707070 })
            );
            backMesh.position.set(0, 0.4, -0.35);
            
            // Cushions
            const cushionGeom = new THREE.BoxGeometry(0.6, 0.15, 0.8);
            const cushionMaterial = new THREE.MeshStandardMaterial({ color: 0x909090 });
            
            const leftCushion = new THREE.Mesh(cushionGeom, cushionMaterial);
            leftCushion.position.set(-0.65, 0.275, 0);
            
            const rightCushion = new THREE.Mesh(cushionGeom, cushionMaterial);
            rightCushion.position.set(0.65, 0.275, 0);
            
            // Tambahkan semua mesh ke group
            sofaGroup.add(baseMesh, backMesh, leftCushion, rightCushion);
            
            // Set posisi group
            sofaGroup.position.set(x, 0.2, z);
            
            // Tambahkan ke scene dan buat draggable
            scene.add(sofaGroup);
            furnitureObjects.set(sofaGroup.uuid, sofaGroup);
            makeFurnitureDraggable(sofaGroup);
            return;
            
        case 'chair':
            const chairGroup = new THREE.Group();
            
            // Seat
            const seat = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.1, 0.6),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            
            // Back
            const back = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.8, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            back.position.set(0, 0.45, -0.25);
            
            // Legs
            const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
            const legMaterial = new THREE.MeshStandardMaterial({ color: 0x4A2511 });
            
            const leg1 = new THREE.Mesh(legGeometry, legMaterial);
            const leg2 = new THREE.Mesh(legGeometry, legMaterial);
            const leg3 = new THREE.Mesh(legGeometry, legMaterial);
            const leg4 = new THREE.Mesh(legGeometry, legMaterial);
            
            leg1.position.set(-0.25, -0.2, -0.25);
            leg2.position.set(-0.25, -0.2, 0.25);
            leg3.position.set(0.25, -0.2, -0.25);
            leg4.position.set(0.25, -0.2, 0.25);
            
            // Add everything to group
            chairGroup.add(seat);
            chairGroup.add(back);
            chairGroup.add(leg1);
            chairGroup.add(leg2);
            chairGroup.add(leg3);
            chairGroup.add(leg4);
            
            // Set group position
            chairGroup.position.set(x, 0.25, z);
            
            scene.add(chairGroup);
            furnitureObjects.set(chairGroup.uuid, chairGroup);
            makeFurnitureDraggable(chairGroup);
            return;
            
        case 'table':
            const tableGroup = new THREE.Group();
            
            // Table top
            const topGeom = new THREE.BoxGeometry(1.5, 0.1, 1.5);
            const top = new THREE.Mesh(
                topGeom,
                new THREE.MeshStandardMaterial({ color: 0x4B2F1C })
            );
            
            // Table legs
            const tableLegGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.7);
            const tableLegMaterial = new THREE.MeshStandardMaterial({ color: 0x3B1F0C });
            
            const tableLegs = [];
            const tableLegPositions = [
                [-0.65, -0.65], [-0.65, 0.65],
                [0.65, -0.65], [0.65, 0.65]
            ];
            
            tableLegPositions.forEach(pos => {
                const leg = new THREE.Mesh(tableLegGeom, tableLegMaterial);
                leg.position.set(pos[0], -0.3, pos[1]);
                tableLegs.push(leg);
            });
            
            tableGroup.add(top, ...tableLegs);
            tableGroup.position.set(x, 0.35, z);
            
            scene.add(tableGroup);
            furnitureObjects.set(tableGroup.uuid, tableGroup);
            makeFurnitureDraggable(tableGroup);
            return;
    }
}

function makeFurnitureDraggable(furnitureGroup) {
    furnitureGroup.userData.isDraggable = true;
    furnitureGroup.userData.startY = furnitureGroup.position.y;
    furnitureGroup.userData.isSelected = false;
    
    const dragControls = new THREE.DragControls([furnitureGroup], camera, renderer.domElement);
    
    dragControls.addEventListener('dragstart', function(event) {
        controls.enabled = false;
        selectedFurniture = event.object;
        event.object.userData.isSelected = true;
    });
    
    dragControls.addEventListener('drag', function(event) {
        event.object.position.y = event.object.userData.startY;
        
        const maxX = 10;
        const maxZ = 10;
        event.object.position.x = Math.max(-maxX, Math.min(maxX, event.object.position.x));
        event.object.position.z = Math.max(-maxZ, Math.min(maxZ, event.object.position.z));
    });
    
    dragControls.addEventListener('dragend', function(event) {
        controls.enabled = true;
    });

    dragControls.transformGroup = true;
}

// Tambahkan event listener untuk keyboard
document.addEventListener('keydown', function(event) {
    if (!selectedFurniture) return;

    switch(event.key) {
        case 'r': // Rotate clockwise
        case 'R':
            selectedFurniture.rotation.y += ROTATION_SPEED;
            break;
        case 'e': // Rotate counter-clockwise
        case 'E':
            selectedFurniture.rotation.y -= ROTATION_SPEED;
            break;
        case 'Delete': // Hapus furniture yang dipilih
        case 'Backspace':
            if (selectedFurniture) {
                // Hapus dari scene
                scene.remove(selectedFurniture);
                // Hapus dari tracking
                furnitureObjects.delete(selectedFurniture.uuid);
                // Dispose resources
                selectedFurniture.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
                selectedFurniture = null;
            }
            break;
        case 'Escape': // Deselect furniture
            selectedFurniture = null;
            break;
    }
});

// Update click handler untuk furniture
document.addEventListener('click', function(event) {
    // Deselect previous furniture
    if (selectedFurniture) {
        selectedFurniture.userData.isSelected = false;
    }
    
    // Ray casting untuk deteksi click pada object
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Convert mouse position to normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Get all objects that can be clicked
    const objects = [];
    scene.traverse(function(object) {
        if (object.userData.isDraggable) {
            objects.push(object);
        }
    });
    
    const intersects = raycaster.intersectObjects(objects, true);
    
    if (intersects.length > 0) {
        // Get the parent group if we clicked a child mesh
        selectedFurniture = intersects[0].object.parent.userData.isDraggable ? 
            intersects[0].object.parent : intersects[0].object;
        selectedFurniture.userData.isSelected = true;
    } else {
        selectedFurniture = null;
    }
});

// Optional: Tambahkan visual feedback untuk selected furniture
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    if (controls) {
        controls.update();
    }
    
    // Add visual feedback for selected furniture (optional)
    if (scene) {
        scene.traverse((object) => {
            if (object.userData.isDraggable) {
                if (object === selectedFurniture) {
                    object.children.forEach(child => {
                        if (child.material) {
                            child.material.opacity = 0.8;
                            child.material.transparent = true;
                        }
                    });
                } else {
                    object.children.forEach(child => {
                        if (child.material) {
                            child.material.opacity = 1;
                            child.material.transparent = false;
                        }
                    });
                }
            }
        });
    }

    // Render scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Tambahkan fungsi baru untuk menampilkan panel furniture
function showFurniturePanel() {
    console.log('Show furniture panel called');
    
    const furniturePanel = document.querySelector('.furniture-panel');
    const contentWrapper = document.querySelector('.content-wrapper');
    
    if (!furniturePanel || !contentWrapper) {
        console.error('Required elements not found');
        return;
    }

    // Hapus controls info yang sudah ada jika ada
    const existingControls = furniturePanel.querySelectorAll('.controls-info');
    existingControls.forEach(control => control.remove());

    // Add model-loaded class to wrapper
    contentWrapper.classList.add('model-loaded');
    
    // Show panel
    furniturePanel.style.display = 'block';
    furniturePanel.style.opacity = '0';
    
    // Initialize furniture interactions
    initFurnitureInteractions();

    // Force reflow
    furniturePanel.offsetHeight;
    
    // Add show class and fade in
    requestAnimationFrame(() => {
        furniturePanel.classList.add('show');
        furniturePanel.style.opacity = '1';
    });

    // Tambahkan controls info baru
    addControlsInfo();
}

// Tambahkan informasi kontrol ke UI
function addControlsInfo() {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'controls-info';
    infoDiv.innerHTML = `
        <h4>Controls:</h4>
        <ul>
            <li>Click & Drag: Move furniture</li>
            <li>R: Rotate clockwise</li>
            <li>E: Rotate counter-clockwise</li>
            <li>Delete/Backspace: Remove selected furniture</li>
            <li>Esc: Deselect furniture</li>
        </ul>
    `;
    document.querySelector('.furniture-panel').appendChild(infoDiv);
}

// Tambahkan event listener untuk window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Fungsi untuk mengambil tampilan 3D dari scene
function capture3DView() {
    // Render scene dari sudut pandang saat ini
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png', 1.0);
}

// Fungsi download yang diperbarui untuk 3D view
async function downloadFloorplanPDF() {
    if (!isModelLoaded || !renderer) {
        alert('Please upload a floorplan first');
        return;
    }

    try {
        // Ambil beberapa sudut pandang 3D
        // Simpan posisi kamera saat ini
        const originalPosition = camera.position.clone();
        const originalRotation = camera.rotation.clone();
        
        const views = [];
        
        // Tampilan perspektif (current view)
        views.push({
            title: 'Perspective View',
            image: capture3DView()
        });
        
        // Tampilan dari depan
        camera.position.set(0, 5, 15);
        camera.lookAt(0, 0, 0);
        views.push({
            title: 'Front View',
            image: capture3DView()
        });
        
        // Tampilan dari samping
        camera.position.set(15, 5, 0);
        camera.lookAt(0, 0, 0);
        views.push({
            title: 'Side View',
            image: capture3DView()
        });
        
        // Kembalikan kamera ke posisi awal
        camera.position.copy(originalPosition);
        camera.rotation.copy(originalRotation);
        renderer.render(scene, camera);
        
        // Buat PDF
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        
        // Tambahkan judul
        pdf.setFontSize(20);
        pdf.text('Interior Design Layout', pageWidth/2, margin + 10, { align: 'center' });
        
        // Hitung ukuran gambar
        const imgWidth = (pageWidth - (margin * 2));
        const imgHeight = (pageHeight - (margin * 4)) / 2;
        
        // Tambahkan gambar-gambar dengan label
        views.forEach((view, index) => {
            if (index > 0) pdf.addPage();
            
            pdf.setFontSize(14);
            pdf.text(view.title, pageWidth/2, margin + 5, { align: 'center' });
            
            pdf.addImage(
                view.image,
                'PNG',
                margin,
                margin + 10,
                imgWidth,
                imgHeight
            );
        });
        
        // Tambahkan informasi furniture
        let furnitureList = 'Furniture List:\n';
        furnitureObjects.forEach((obj, id) => {
            furnitureList += `- ${obj.userData.type || 'Unknown'} (x: ${obj.position.x.toFixed(2)}, z: ${obj.position.z.toFixed(2)})\n`;
        });
        
        pdf.setFontSize(12);
        pdf.text(furnitureList, margin, pageHeight - margin);

        // Download PDF
        pdf.save('interior-design-3d.pdf');

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
    }
}

// Pastikan event listener sudah terpasang
document.getElementById('downloadBtn').addEventListener('click', downloadFloorplanPDF);
