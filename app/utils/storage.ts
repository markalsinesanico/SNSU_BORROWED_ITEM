import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Item {
  id: string;
  name: string;
  status: string;
  imageUrl: string;
  availableUnits: number;
}

const ITEMS_STORAGE_KEY = '@borrowed_items';

export const saveItems = async (items: Item[]) => {
  try {
    await AsyncStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving items:', error);
  }
};

export const getItems = async (): Promise<Item[]> => {
  try {
    const items = await AsyncStorage.getItem(ITEMS_STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error('Error getting items:', error);
    return [];
  }
};

export const addItem = async (newItem: Omit<Item, 'id'>) => {
  try {
    const existingItems = await getItems();
    const id = Math.max(...existingItems.map(item => parseInt(item.id)), 0) + 1;
    const itemToAdd = {
      ...newItem,
      id: id.toString(),
      status: 'Available'
    };
    await saveItems([...existingItems, itemToAdd]);
    return itemToAdd;
  } catch (error) {
    console.error('Error adding item:', error);
    return null;
  }
};

export const updateItemUnits = async (itemId: string, change: number) => {
  try {
    const items = await getItems();
    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { ...item, availableUnits: Math.max(0, item.availableUnits + change) }
        : item
    );
    await saveItems(updatedItems);
    return updatedItems.find(item => item.id === itemId);
  } catch (error) {
    console.error('Error updating item units:', error);
    return null;
  }
};

export const updateItem = async (itemId: string, updatedData: Partial<Omit<Item, 'id'>>) => {
  try {
    const items = await getItems();
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, ...updatedData } : item
    );
    await saveItems(updatedItems);
    return updatedItems.find(item => item.id === itemId) || null;
  } catch (error) {
    console.error('Error updating item:', error);
    return null;
  }
};

export const deleteItem = async (itemId: string) => {
  try {
    const items = await getItems();
    const updatedItems = items.filter(item => item.id !== itemId);
    await saveItems(updatedItems);
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
};

// Add this function to initialize the database
export const initDatabase = async () => {
  try {
    // Check if items are already initialized
    const items = await getItems();
    if (!items || items.length === 0) {
      // Initialize with an empty array or some default values if needed
      await saveItems([]);
      console.log('Database initialized.');
    } else {
      console.log('Database already initialized.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
