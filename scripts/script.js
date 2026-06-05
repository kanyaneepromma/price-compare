        // Start items matching the standard format requested
        let items = [
            { brand: "ยี่ห้อ A", capacity: 29, price: 580 },
            { brand: "ยี่ห้อ B", capacity: 10, price: 250 },
            { brand: "ยี่ห้อ C", capacity: 35, price: 630 }
        ];

        let editIndex = -1;
        const DB_NAME = 'MobilePriceCompareDB';
        const STORE_NAME = 'appStore';
        let dbInstance = null;
        let isStorageSupported = false;

        // SAFE DATABASE INITIALIZER
        function initDatabase(callback) {
            try {
                if (!window.indexedDB) {
                    setStorageBackupMode();
                    return callback();
                }

                const request = indexedDB.open(DB_NAME, 1);
                
                request.onupgradeneeded = function(e) {
                    try {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(STORE_NAME)) {
                            db.createObjectStore(STORE_NAME);
                        }
                    } catch(err) {
                        console.warn("Database init error:", err);
                    }
                };
                
                request.onsuccess = function(e) {
                    try {
                        dbInstance = e.target.result;
                        isStorageSupported = true;
                        
                        document.getElementById('dbStatus').innerText = "บันทึกข้อมูลส่วนตัวในเครื่องอัตโนมัติ";
                        
                        const transaction = dbInstance.transaction([STORE_NAME], 'readonly');
                        const store = transaction.objectStore(STORE_NAME);
                        
                        // Load saved items
                        const getItemsRequest = store.get('savedItemsList');
                        getItemsRequest.onsuccess = function() {
                            if (getItemsRequest.result && getItemsRequest.result.length > 0) {
                                items = getItemsRequest.result;
                            } else {
                                saveDatabaseState();
                            }
                            callback();
                        };
                        getItemsRequest.onerror = function() {
                            callback();
                        };
                    } catch (err) {
                        setStorageBackupMode();
                        callback();
                    }
                };
                
                request.onerror = function() {
                    setStorageBackupMode();
                    callback();
                };

            } catch (error) {
                setStorageBackupMode();
                callback();
            }
        }

        function setStorageBackupMode() {
            isStorageSupported = false;
            document.getElementById('dbStatus').innerText = "โหมดทดลองใช้ชั่วคราว (ไม่เซฟ)";
        }

        function saveDatabaseState() {
            if (!isStorageSupported || !dbInstance) return;
            try {
                const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                store.put(items, 'savedItemsList');
            } catch (err) {
                console.warn("Could not save to DB:", err);
            }
        }

        // Calculate rate per 1 capacity unit
        function calculateUnitPrice(item) {
            if (!item.capacity || item.capacity <= 0) return 0;
            return item.price / item.capacity;
        }

        // Custom Error Banner Actions
        function showError(message) {
            const toast = document.getElementById('errorToast');
            const text = document.getElementById('errorText');
            text.innerText = message;
            toast.classList.remove('hidden');
            setTimeout(() => {
                toast.classList.remove('translate-y-[-10px]');
            }, 10);
        }

        // Dismiss Toast
        function dismissError() {
            const toast = document.getElementById('errorToast');
            toast.classList.add('translate-y-[-10px]');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }

        function handleSubmit() {
            dismissError();
            const brandInput = document.getElementById('brand');
            const capInput = document.getElementById('capacity');
            const priceInput = document.getElementById('price');

            const brand = brandInput.value.trim();
            const capacity = parseFloat(capInput.value);
            const price = parseFloat(priceInput.value);

            if (!brand) {
                showError("กรุณากรอกระบุยี่ห้อ หรือระบุขนาด");
                brandInput.focus();
                return;
            }
            if (isNaN(capacity) || capacity <= 0) {
                showError("ความจุต้องเป็นตัวเลขเชิงบวกที่มากกว่า 0");
                capInput.focus();
                return;
            }
            if (isNaN(price) || price < 0) {
                showError("กรุณากรอกราคาที่ถูกต้อง (เป็นตัวเลข)");
                priceInput.focus();
                return;
            }

            if (editIndex === -1) {
                items.push({ brand, capacity, price });
            } else {
                items[editIndex] = { brand, capacity, price };
                cancelEdit(); 
            }

            saveDatabaseState();

            // Clear inputs
            brandInput.value = '';
            capInput.value = '';
            priceInput.value = '';

            updateApp();
        }

        function startEdit(index) {
            dismissError();
            editIndex = index;
            const item = items[index];

            document.getElementById('brand').value = item.brand;
            document.getElementById('capacity').value = item.capacity;
            document.getElementById('price').value = item.price;

            // Turn UI into orange Edit layout
            document.getElementById('formTitle').innerHTML = `
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                กำลังแก้ไขข้อมูลสินค้า
            `;
            document.getElementById('cancelBtn').classList.remove('hidden');
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.innerHTML = `
                <span>บันทึกการแก้ไข</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            `;
            submitBtn.className = "w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95";

            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.getElementById('brand').focus();
        }

        function cancelEdit() {
            editIndex = -1;
            document.getElementById('brand').value = '';
            document.getElementById('capacity').value = '';
            document.getElementById('price').value = '';

            // Restore standard Form look
            document.getElementById('formTitle').innerHTML = `
                <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                เพิ่มข้อมูลสินค้า
            `;
            document.getElementById('cancelBtn').classList.add('hidden');
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.innerHTML = `
                <span>เพิ่มรายการลงตาราง</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            `;
            submitBtn.className = "w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95";
            dismissError();
        }

        function deleteItem(index) {
            if (index === editIndex) {
                cancelEdit();
            } else if (index < editIndex) {
                editIndex--;
            }
            items.splice(index, 1);
            saveDatabaseState(); 
            updateApp();
        }

        // CUSTOM MODAL TRIGGER FUNCTIONS
        function clearAllItems() {
            // Open beautiful custom modal instead of browser native confirm dialog
            document.getElementById('customConfirmModal').classList.remove('hidden');
        }

        function closeConfirmModal() {
            document.getElementById('customConfirmModal').classList.add('hidden');
        }

        function executeClearAll() {
            items = [];
            cancelEdit();
            saveDatabaseState();
            updateApp();
            closeConfirmModal();
        }

        function updateApp() {
            // Update counter badge
            document.getElementById('itemCount').innerText = `${items.length} รายการ`;

            // Calculate Best Rate (Lowest Price / Unit) & Worst Rate (Highest Price / Unit)
            let lowestPricePerUnit = Infinity;
            let highestPricePerUnit = -Infinity;
            let bestIndex = -1;
            let worstIndex = -1;

            items.forEach((item, index) => {
                const rate = calculateUnitPrice(item);
                if (rate > 0) {
                    if (rate < lowestPricePerUnit) {
                        lowestPricePerUnit = rate;
                        bestIndex = index;
                    }
                    if (rate > highestPricePerUnit) {
                        highestPricePerUnit = rate;
                        worstIndex = index;
                    }
                }
            });

            // Update Top Featured "Best Deal" Card
            const spotlight = document.getElementById('bestDealSpotlight');
            if (bestIndex !== -1 && items.length > 0) {
                const bestItem = items[bestIndex];
                document.getElementById('bestBrandName').innerText = bestItem.brand;
                document.getElementById('bestDetails').innerText = `ความจุ ${bestItem.capacity.toLocaleString()} / ราคารวม ${bestItem.price.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})} บ.`;
                document.getElementById('bestUnitPrice').innerText = lowestPricePerUnit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                spotlight.classList.remove('hidden');
            } else {
                spotlight.classList.add('hidden');
            }

            // Only mark "Worst" if we have at least 2 items and they actually differ in price
            const showWorst = (items.length >= 2 && worstIndex !== bestIndex && highestPricePerUnit > lowestPricePerUnit);

            // Build dynamic Cards List
            const container = document.getElementById('itemsContainer');
            container.innerHTML = '';

            if (items.length === 0) {
                container.innerHTML = `
                    <div class="bg-white rounded-2xl border border-dashed border-slate-200 py-10 px-4 text-center text-slate-400">
                        <svg class="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                        <span class="text-sm">ไม่มีสินค้าเปรียบเทียบในขณะนี้ เพิ่มด้านบนได้เลย!</span>
                    </div>
                `;
                return;
            }

            items.forEach((item, index) => {
                const unitPrice = calculateUnitPrice(item);
                const isBest = index === bestIndex;
                const isWorst = showWorst && (index === worstIndex);

                const card = document.createElement('div');
                
                // Style based on deal rating
                let cardClass = 'bg-white border border-slate-150 rounded-2xl p-4 shadow-sm relative transition-all';
                if (isBest) {
                    cardClass = 'bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-sm relative transition-all';
                } else if (isWorst) {
                    cardClass = 'bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 shadow-sm relative transition-all';
                }

                card.className = cardClass;

                card.innerHTML = `
                    <div class="flex justify-between items-start gap-2">
                        <div class="min-w-0 flex-grow">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <h4 class="font-bold text-slate-900 truncate text-base">${item.brand}</h4>
                                ${isBest ? '<span class="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>คุ้มที่สุด!</span>' : ''}
                                ${isWorst ? '<span class="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>แพงที่สุด! ❌</span>' : ''}
                            </div>
                            <p class="text-xs text-slate-400 mt-1">
                                ความจุ <span class="font-bold text-slate-600">${item.capacity.toLocaleString()}</span> &middot; ราคารวม <span class="font-bold text-slate-600">${item.price.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})} ฿</span>
                            </p>
                        </div>
                        
                        <div class="text-right shrink-0">
                            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">ราคาต่อหน่วย</p>
                            <p class="text-lg font-extrabold ${isBest ? 'text-emerald-700' : (isWorst ? 'text-rose-700' : 'text-indigo-600')}">
                                ${unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
                                <span class="text-xs font-normal text-slate-400">฿/1</span>
                            </p>
                        </div>
                    </div>

                    <!-- Bottom Action Bar inside Card (High contrast white-background buttons) -->
                    <div class="mt-3 pt-3 border-t border-dashed ${isBest ? 'border-emerald-200' : (isWorst ? 'border-rose-200' : 'border-slate-100')} flex justify-end gap-2">
                        <button onclick="startEdit(${index})" class="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg transition-all shadow-sm active:scale-95">
                            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            แก้ไข
                        </button>
                        <button onclick="deleteItem(${index})" class="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-rose-200 px-3 py-2 rounded-lg transition-all shadow-sm active:scale-95">
                            <svg class="w-3.5 h-3.5 text-rose-500 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            ลบออก
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // Initialize App
        window.onload = function() {
            initDatabase(function() {
                updateApp();
            });
        }