import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Chip,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { getFirestoreInstance } from '../services/firebase';
import { INDIAN_STATES_AND_DISTRICTS } from '../data/indianLocations';

interface BrandItem {
  name: string;
  models: string[];
}

interface CategoryItem {
  id: string;
  name: string;
  subcategories: string[];
}

const DEFAULT_BRANDS: BrandItem[] = [
  { name: 'Maruti Suzuki', models: ['Swift', 'Baleno', 'Brezza', 'Dzire', 'Ertiga', 'Wagon R', 'Alto', 'Grand Vitara'] },
  { name: 'Hyundai', models: ['Creta', 'i20', 'Venue', 'Verna', 'Grand i10', 'Aura', 'Tucson'] },
  { name: 'Tata', models: ['Nexon', 'Punch', 'Harrier', 'Safari', 'Altroz', 'Tiago', 'Tigor'] },
  { name: 'Mahindra', models: ['Thar', 'Scorpio-N', 'XUV700', 'Bolero', 'XUV300', 'Scorpio Classic'] },
  { name: 'Toyota', models: ['Innova Crysta', 'Fortuner', 'Hyryder', 'Glanza', 'Hilux', 'Camry'] },
  { name: 'Honda', models: ['City', 'Amaze', 'Elevate', 'WR-V', 'Civic'] },
  { name: 'Kia', models: ['Seltos', 'Sonet', 'Carens', 'Carnival', 'EV6'] },
  { name: 'Volkswagen', models: ['Virtus', 'Taigun', 'Polo', 'Vento', 'Tiguan'] },
  { name: 'Skoda', models: ['Slavia', 'Kushaq', 'Octavia', 'Superb', 'Rapid'] },
  { name: 'Ford', models: ['EcoSport', 'Endeavour', 'Figo', 'Aspire', 'Freestyle'] },
];

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'engine', name: 'Engine & Mechanical', subcategories: ['Cylinder Head', 'Pistons', 'Turbocharger', 'Alternator', 'Starter Motor', 'Fuel Injectors'] },
  { id: 'body', name: 'Body & Exterior', subcategories: ['Front Bumper', 'Rear Bumper', 'Headlight Set', 'Tail Lights', 'Doors', 'Bonnet', 'Side Mirrors'] },
  { id: 'electrical', name: 'Lights & Electricals', subcategories: ['ECU / ECM', 'Wiring Harness', 'Battery', 'Sensors', 'Instrument Cluster', 'Fuse Box'] },
  { id: 'suspension', name: 'Suspension & Brakes', subcategories: ['Shock Absorbers', 'Brake Calipers', 'Disc Rotors', 'Control Arms', 'Steering Rack', 'ABS Module'] },
  { id: 'interior', name: 'Interior & Wheels', subcategories: ['Dashboard', 'Steering Wheel', 'Seats', 'Infotainment Screen', 'AC Compressor', 'Alloy Wheels'] },
];

export const AdminTaxonomyCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'brands' | 'categories' | 'locations'>('brands');
  const [brands, setBrands] = useState<BrandItem[]>(DEFAULT_BRANDS);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modals for adding
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandModels, setNewBrandModels] = useState('');

  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [selectedBrandIndex, setSelectedBrandIndex] = useState<number | null>(null);
  const [newModelName, setNewModelName] = useState('');

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySubs, setNewCategorySubs] = useState('');

  useEffect(() => {
    fetchTaxonomy();
  }, []);

  const fetchTaxonomy = async () => {
    try {
      setLoading(true);
      const db = getFirestoreInstance();
      if (!db) return;
      const docSnap = await db.collection('taxonomy').doc('data').get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data?.brands && Array.isArray(data.brands)) {
          setBrands(data.brands);
        }
        if (data?.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (err) {
      console.warn('[AdminTaxonomyCMS] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCloud = async () => {
    try {
      setSaving(true);
      const db = getFirestoreInstance();
      if (!db) {
        Alert.alert('Notice', 'Firebase Firestore not available.');
        return;
      }
      await db.collection('taxonomy').doc('data').set({
        brands,
        categories,
        updatedAt: Date.now(),
      });
      Alert.alert('Success', 'Taxonomy CMS configuration saved to Cloud successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) {
      Alert.alert('Error', 'Brand name is required');
      return;
    }
    const modelsArray = newBrandModels
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    setBrands([...brands, { name: newBrandName.trim(), models: modelsArray }]);
    setNewBrandName('');
    setNewBrandModels('');
    setBrandModalVisible(false);
  };

  const handleDeleteBrand = (index: number) => {
    Alert.alert('Confirm Delete', `Delete ${brands[index].name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = [...brands];
          updated.splice(index, 1);
          setBrands(updated);
        },
      },
    ]);
  };

  const handleAddModelToBrand = () => {
    if (selectedBrandIndex === null || !newModelName.trim()) return;
    const updated = [...brands];
    if (!updated[selectedBrandIndex].models.includes(newModelName.trim())) {
      updated[selectedBrandIndex].models.push(newModelName.trim());
      setBrands(updated);
    }
    setNewModelName('');
    setModelModalVisible(false);
  };

  const handleDeleteModel = (brandIndex: number, modelName: string) => {
    const updated = [...brands];
    updated[brandIndex].models = updated[brandIndex].models.filter((m) => m !== modelName);
    setBrands(updated);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }
    const subArray = newCategorySubs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newId = newCategoryName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setCategories([
      ...categories,
      { id: newId, name: newCategoryName.trim(), subcategories: subArray },
    ]);
    setNewCategoryName('');
    setNewCategorySubs('');
    setCategoryModalVisible(false);
  };

  const handleDeleteCategory = (index: number) => {
    Alert.alert('Confirm Delete', `Delete ${categories[index].name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = [...categories];
          updated.splice(index, 1);
          setCategories(updated);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Sub Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'brands' && styles.tabBtnActive]}
          onPress={() => setActiveTab('brands')}
        >
          <Text style={[styles.tabText, activeTab === 'brands' && styles.tabTextActive]}>
            Brands & Models ({brands.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'categories' && styles.tabBtnActive]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>
            Categories ({categories.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'locations' && styles.tabBtnActive]}
          onPress={() => setActiveTab('locations')}
        >
          <Text style={[styles.tabText, activeTab === 'locations' && styles.tabTextActive]}>
            States & Hubs ({INDIAN_STATES_AND_DISTRICTS.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Header */}
      <View style={styles.actionsHeader}>
        <Button
          mode="contained"
          onPress={handleSaveToCloud}
          loading={saving}
          disabled={saving}
          style={styles.saveBtn}
          labelStyle={{ color: '#FFFFFF', fontWeight: '700' }}
          icon="cloud-upload"
        >
          Save All to Cloud
        </Button>

        {activeTab === 'brands' && (
          <Button
            mode="outlined"
            onPress={() => setBrandModalVisible(true)}
            style={styles.addBtn}
            labelStyle={{ color: '#1565FF', fontWeight: '700' }}
            icon="plus"
          >
            Add Brand
          </Button>
        )}

        {activeTab === 'categories' && (
          <Button
            mode="outlined"
            onPress={() => setCategoryModalVisible(true)}
            style={styles.addBtn}
            labelStyle={{ color: '#1565FF', fontWeight: '700' }}
            icon="plus"
          >
            Add Category
          </Button>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ padding: 40 }} color="#1565FF" />
      ) : (
        <ScrollView style={styles.contentScroll}>
          {/* BRANDS TAB */}
          {activeTab === 'brands' && (
            <View style={styles.cardsCol}>
              {brands.map((b, bIdx) => (
                <Surface key={`brand-${b.name}-${bIdx}`} style={styles.cmsCard} elevation={2}>
                  <View style={styles.cmsCardHeader}>
                    <View style={styles.brandTitleRow}>
                      <IconButton icon="car" size={20} iconColor="#1565FF" style={{ margin: 0 }} />
                      <Text style={styles.cmsCardTitle}>{b.name}</Text>
                      <Chip style={styles.countChip} textStyle={{ fontSize: 10 }}>
                        {b.models.length} models
                      </Chip>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      <IconButton
                        icon="plus-circle"
                        size={20}
                        iconColor="#10B981"
                        onPress={() => {
                          setSelectedBrandIndex(bIdx);
                          setModelModalVisible(true);
                        }}
                      />
                      <IconButton
                        icon="delete-outline"
                        size={20}
                        iconColor="#EF4444"
                        onPress={() => handleDeleteBrand(bIdx)}
                      />
                    </View>
                  </View>

                  <View style={styles.chipsWrap}>
                    {b.models.map((m) => (
                      <Chip
                        key={m}
                        style={styles.modelChip}
                        textStyle={{ fontSize: 11, color: '#E2E8F0' }}
                        onClose={() => handleDeleteModel(bIdx, m)}
                      >
                        {m}
                      </Chip>
                    ))}
                  </View>
                </Surface>
              ))}
            </View>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <View style={styles.cardsCol}>
              {categories.map((c, cIdx) => (
                <Surface key={`cat-${c.id}-${cIdx}`} style={styles.cmsCard} elevation={2}>
                  <View style={styles.cmsCardHeader}>
                    <View style={styles.brandTitleRow}>
                      <IconButton icon="shape-outline" size={20} iconColor="#8B5CF6" style={{ margin: 0 }} />
                      <Text style={styles.cmsCardTitle}>{c.name}</Text>
                      <Chip style={styles.countChip} textStyle={{ fontSize: 10 }}>
                        {c.subcategories.length} subparts
                      </Chip>
                    </View>
                    <IconButton
                      icon="delete-outline"
                      size={20}
                      iconColor="#EF4444"
                      onPress={() => handleDeleteCategory(cIdx)}
                    />
                  </View>

                  <View style={styles.chipsWrap}>
                    {c.subcategories.map((s) => (
                      <Chip
                        key={s}
                        style={styles.modelChip}
                        textStyle={{ fontSize: 11, color: '#E2E8F0' }}
                      >
                        {s}
                      </Chip>
                    ))}
                  </View>
                </Surface>
              ))}
            </View>
          )}

          {/* LOCATIONS TAB */}
          {activeTab === 'locations' && (
            <View style={styles.cardsCol}>
              {INDIAN_STATES_AND_DISTRICTS.map((st) => (
                <Surface key={st.state} style={styles.cmsCard} elevation={2}>
                  <View style={styles.cmsCardHeader}>
                    <View style={styles.brandTitleRow}>
                      <IconButton icon="map-marker-outline" size={20} iconColor="#10B981" style={{ margin: 0 }} />
                      <Text style={styles.cmsCardTitle}>{st.state}</Text>
                      <Chip style={styles.countChip} textStyle={{ fontSize: 10 }}>
                        {st.districts.length} districts
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.chipsWrap}>
                    {st.districts.slice(0, 12).map((d) => (
                      <Chip key={d} style={styles.locChip} textStyle={{ fontSize: 10, color: '#94A3B8' }}>
                        {d}
                      </Chip>
                    ))}
                    {st.districts.length > 12 && (
                      <Chip style={styles.locChip} textStyle={{ fontSize: 10, color: '#6366F1' }}>
                        +{st.districts.length - 12} more
                      </Chip>
                    )}
                  </View>
                </Surface>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Brand Modal */}
      <Modal
        visible={brandModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBrandModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Surface style={styles.modalCard} elevation={5}>
            <Text style={styles.modalHeader}>Add Car Brand</Text>
            <TextInput
              label="Brand Name (e.g. Nissan, MG, Jeep)"
              value={newBrandName}
              onChangeText={setNewBrandName}
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Initial Models (comma separated, e.g. Magnite, Kicks)"
              value={newBrandModels}
              onChangeText={setNewBrandModels}
              mode="outlined"
              style={styles.modalInput}
            />
            <View style={styles.modalBtnRow}>
              <Button onPress={() => setBrandModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleAddBrand}>
                Add Brand
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>

      {/* Add Model Modal */}
      <Modal
        visible={modelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModelModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Surface style={styles.modalCard} elevation={5}>
            <Text style={styles.modalHeader}>
              Add Model to {selectedBrandIndex !== null ? brands[selectedBrandIndex]?.name : ''}
            </Text>
            <TextInput
              label="Model Name (e.g. Jimny, Fronx, Creta N Line)"
              value={newModelName}
              onChangeText={setNewModelName}
              mode="outlined"
              style={styles.modalInput}
            />
            <View style={styles.modalBtnRow}>
              <Button onPress={() => setModelModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleAddModelToBrand}>
                Add Model
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Surface style={styles.modalCard} elevation={5}>
            <Text style={styles.modalHeader}>Add Part Category</Text>
            <TextInput
              label="Category Name (e.g. Transmission & Gearbox)"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Subcategories (comma separated, e.g. Clutch Plate, Flywheel)"
              value={newCategorySubs}
              onChangeText={setNewCategorySubs}
              mode="outlined"
              style={styles.modalInput}
            />
            <View style={styles.modalBtnRow}>
              <Button onPress={() => setCategoryModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleAddCategory}>
                Add Category
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 6,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#1565FF',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  actionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    flex: 1,
  },
  addBtn: {
    borderColor: '#1565FF',
    borderRadius: 10,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cardsCol: {
    gap: 12,
    paddingBottom: 24,
  },
  cmsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cmsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cmsCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  countChip: {
    backgroundColor: '#0F172A',
    height: 24,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modelChip: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
  },
  locChip: {
    backgroundColor: '#0F172A',
    height: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  modalInput: {
    marginBottom: 12,
    backgroundColor: '#0F172A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
