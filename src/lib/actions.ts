'use server'

import { currentUser } from "@clerk/nextjs";
import { db } from "@/lib/client";
import { revalidatePath } from "next/cache";

export const removeProfileImage = async () => {
  const authUser = await currentUser();
  if (!authUser) throw new Error("Unauthorized");

  const response = await db.user.update({
    where: {
      clerkId: authUser.id,
    },
    data: {
      profileImage: null,
    },
  });
  
  revalidatePath('/settings');
  return response;
};

export const uploadProfileImage = async(url: string) => {
  const authUser = await currentUser();
  if (!authUser) throw new Error("Unauthorized");

  const response = await db.user.update({
    where: {
      clerkId: authUser.id,
    },
    data: {
      profileImage: url
    }
  });
  
  revalidatePath('/settings');
  return response;
};

export const updateUserName = async(name: string) => {
  const authUser = await currentUser();
  if (!authUser) throw new Error("Unauthorized");

  const response = await db.user.update({
    where: {
      clerkId: authUser.id,
    },
    data: {
      name: name
    }
  });
  
  revalidatePath('/settings');
  return response;
};