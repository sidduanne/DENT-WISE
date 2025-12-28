"use server"

import { tr } from "date-fns/locale"
import { prisma } from "../prisma"
import { auth } from "@clerk/nextjs/server";

function transformAppointment(appointment:any){
    return {
        ...appointment,
        patientName:`${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim(),
        patientEmail:appointment.user.email,
        doctorName:appointment.doctor.name,
        doctorImageUrl:appointment.doctor.imageUrl || "",
        date:appointment.date.toISOString().split("T")[0],
    }
}

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

export async function getUserAppointmentStats(){
    try {
        const {userId}=await auth();
        if(!userId) throw new Error("you must be authenticated");
        const user=await prisma.user.findUnique({where:{clerkId:userId}});
        if(!user) throw new Error("user not found");
        const [totalCount,completedCount]=await Promise.all([
            prisma.appointment.count({where:{userId:userId}}),
            prisma.appointment.count({where:{userId:userId,status:"COMPLETED"}}),
        ]);
        return {
            totalAppointments:totalCount,
            completedAppointments:completedCount,
        };
    } catch (error) {
        console.error("error fetching user appointment stats",error);
        return {totalAppointments:0,completedAppointments:0};
    }
}

export async function getUserAppointments() {
    try {
        const {userId}=await auth();
        if(!userId) throw new Error("you must be logged in to view appointments");
        const user=await prisma.user.findUnique({where:{clerkId:userId}});
        if(!user) throw new Error("User not found.Please ensure your account is properly set up");
        const appointments=await prisma.appointment.findMany({
            where:{userId:userId},
            include:{
                user:{select:{firstName:true,lastName:true,email:true}},
                doctor:{select:{name:true,imageUrl:true}},
            },
            orderBy:[{date:"asc"},{time:"asc"}],
        });
        return appointments.map(transformAppointment);
    } catch (error) {
        console.error("error fetching user appointments",error);
        throw new Error("failed to fetch user appointments");
    }
}