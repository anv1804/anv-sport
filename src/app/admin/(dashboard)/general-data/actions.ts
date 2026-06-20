"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- SPORTS ---

export async function getSports() {
  return await prisma.sport.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createSport(data: { name: string; slug: string; icon?: string; isActive?: boolean }) {
  const sport = await prisma.sport.create({
    data: {
      name: data.name,
      slug: data.slug,
      icon: data.icon,
      isActive: data.isActive ?? true,
    },
  });
  revalidatePath("/admin/general-data");
  return sport;
}

export async function updateSport(id: string, data: { name: string; slug: string; icon?: string; isActive?: boolean }) {
  const sport = await prisma.sport.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/general-data");
  return sport;
}

export async function deleteSport(id: string) {
  await prisma.sport.delete({ where: { id } });
  revalidatePath("/admin/general-data");
}

// --- COUNTRIES ---

export async function getCountries() {
  return await prisma.country.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createCountry(data: { name: string; slug: string; code?: string; flag?: string }) {
  const country = await prisma.country.create({
    data,
  });
  revalidatePath("/admin/general-data");
  return country;
}

export async function updateCountry(id: string, data: { name: string; slug: string; code?: string; flag?: string }) {
  const country = await prisma.country.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/general-data");
  return country;
}

export async function deleteCountry(id: string) {
  await prisma.country.delete({ where: { id } });
  revalidatePath("/admin/general-data");
}

// --- LEAGUES ---

export async function getLeagues() {
  return await prisma.league.findMany({
    include: {
      sport: true,
      country: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createLeague(data: { name: string; slug: string; logo?: string; description?: string; sportId: string; countryId?: string; isActive?: boolean }) {
  const league = await prisma.league.create({
    data: {
      name: data.name,
      slug: data.slug,
      logo: data.logo,
      description: data.description,
      sportId: data.sportId,
      countryId: data.countryId || null,
      isActive: data.isActive ?? true,
    },
  });
  revalidatePath("/admin/general-data");
  return league;
}

export async function updateLeague(id: string, data: { name: string; slug: string; logo?: string; description?: string; sportId: string; countryId?: string; isActive?: boolean }) {
  const league = await prisma.league.update({
    where: { id },
    data: {
      ...data,
      countryId: data.countryId || null,
    },
  });
  revalidatePath("/admin/general-data");
  return league;
}

export async function deleteLeague(id: string) {
  await prisma.league.delete({ where: { id } });
  revalidatePath("/admin/general-data");
}
