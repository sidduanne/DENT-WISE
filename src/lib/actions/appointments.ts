"use server"

import { tr } from "date-fns/locale"
import { prisma } from "../prisma"

export async function getAppointments() {
    try {
        const appointments=await prisma.appointment.findMany({
            include:{
                user:{
                    select:{
                        firstName:true,
                        lastName:true,
                        email:true,
                    }
                },
                doctor:{
                    select:{
                        name:true,
                        imageUrl:true,
                    }
                }
            },orderBy:{createdAt:"desc"}
        });
        return appointments;
    } catch (error) {
        console.log("error fetching appoinments",error);
        throw new Error("failed to fetch appointments");
    }
}