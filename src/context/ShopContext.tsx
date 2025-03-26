import { createContext, useContext, ReactNode, useState } from "react";

type TimeSlot = {
  start: string
  end: string
}

type DaySchedule = {
  name: string
  active: boolean
  timeSlots: TimeSlot[]
}

interface Shop {
  username: string;
  shopname: string;
  profileImageURL: string | null;
  address: string | null;
  category: string | null;
  connected_mp: number | null;
  businessHours: string | null;
  whatsappNumber: string | null;
};

interface ShopContextType {
  shop: Shop | null;
  businessHours: DaySchedule[] | null;
  isOpen: boolean;
  getShop: (username: string) => Promise<void>;
  isLoading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used within a ShopProvider");
  return context;
};

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [businessHours, setBusinessHours] = useState<DaySchedule[] | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const url =  'http://localhost:3000/api';

  const checkIfStoreIsOpen = (schedules: DaySchedule[]): boolean => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const todaySchedule = schedules.find(
      schedule => schedule.name.toLowerCase() === currentDay
    );

    if (!todaySchedule || !todaySchedule.active || todaySchedule.timeSlots.length === 0) {
      return false;
    }

    return todaySchedule.timeSlots.some(slot => {
      const [startHour, startMinute] = slot.start.split(':').map(Number);
      const [endHour, endMinute] = slot.end.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
    });
  };

  const getShop = async (username: string) => { 
    try {
      console.log(username)
      const response = await fetch(url+`/auth/get/${username}`);
      console.log(response)
      const data = await response.json();
      console.log(data)
      if (response.ok && data.user) { 
        setShop(data.user);
        // Parse business hours if they exist
        if (data.user.businessHours) {
          try {
            const parsedHours: DaySchedule[] = JSON.parse(data.user.businessHours);
            setBusinessHours(parsedHours);
            
            // Check if the store is currently open
            setIsOpen(checkIfStoreIsOpen(parsedHours));
          } catch (error) {
            console.error("Error parsing business hours:", error);
            setBusinessHours(null);
            setIsOpen(true); // Default to open if can't parse hours
          }
        } else {
          // If no business hours defined, assume always open
          setBusinessHours(null);
          setIsOpen(true);
        }
      }
      else {
        setShop(null);
        setBusinessHours(null);
        setIsOpen(false);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching shop data:", error);
      setIsLoading(false);
    }
    setIsOpen(true)
  }

  return (
    <ShopContext.Provider value={{
      shop,
      businessHours,
      isOpen,
      getShop,
      isLoading
    }}>
      {children}
    </ShopContext.Provider>
  );
};