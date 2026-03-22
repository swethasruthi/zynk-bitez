import type { Request, Response } from 'express';
import { getActiveChefs, getChefById } from '../models/chefQueries.js';
import { getAllDishes, getDishesByChefId } from '../models/dishQueries.js';
import { getReviewsByChefId } from '../models/reviewQueries.js';
import type { Dish, Review, User } from '../models/schema.js';
import { sampleMeals } from '../data/sampleCatalog.js';

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unexpected error');

const mapDish = (dish: Dish) => ({
  id: String(dish.id),
  chefId: String(dish.chefId),
  name: dish.name,
  description: dish.description,
  category: dish.category === 'veg' ? 'veg' : 'non-veg',
  nutritionalInfo: {
    calories: dish.calories,
    protein: dish.protein,
    carbs: dish.carbs,
    fat: dish.fat,
  },
  allowsCustomization: dish.allowsCustomization,
  customizationOptions: [],
  imageUrl: dish.imageUrl || undefined,
  isActive: dish.isActive,
  isSpecial: dish.isSpecial,
});

type CatalogDish = ReturnType<typeof mapDish>;

const mapChef = (chef: User, dishes: CatalogDish[]) => ({
  id: String(chef.id),
  name: chef.fullName,
  email: chef.email,
  role: 'chef',
  status: chef.isActive ? 'approved' : 'disabled',
  specialty: chef.specialty || chef.chefBusinessName || 'Home Chef',
  bio: chef.bio || '',
  serviceArea: chef.serviceArea || 'Local Area',
  rating: chef.rating || 4.6,
  totalOrders: 0,
  isDisabled: !chef.isActive,
  menuCharts: [],
  dishes,
  avgRating: chef.rating || 4.6,
  reviewCount: chef.reviewCount || 0,
});

const mapReview = (review: Review) => ({
  id: String(review.id),
  orderId: String(review.orderId),
  customerId: String(review.customerId),
  chefId: String(review.chefId),
  mealId: review.mealId,
  mealName: review.mealName,
  rating: review.rating,
  comment: review.comment || undefined,
  createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : new Date().toISOString(),
  isHidden: review.isHidden,
  hiddenReason: review.hiddenReason || undefined,
});

const mapMealFromDish = (dish: Dish) => ({
  id: String(dish.id),
  name: dish.name,
  description: dish.description,
  category: dish.category === 'veg' ? 'Vegetarian' : 'Non-Vegetarian',
  imageUrl: dish.imageUrl || undefined,
  calories: dish.calories,
  isVegetarian: dish.category === 'veg',
});

export const getChefsWithRatings = async (_req: Request, res: Response) => {
  try {
    const chefs = await getActiveChefs();
    const dishes = await getAllDishes();

    const dishesByChef = dishes.reduce<Record<number, CatalogDish[]>>((acc, dish) => {
      acc[dish.chefId] = acc[dish.chefId] || [];
      acc[dish.chefId].push(mapDish(dish));
      return acc;
    }, {});

    const data = chefs
      .map((chef) => mapChef(chef, dishesByChef[chef.id] || []))
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));

    return res.json({ success: true, data });
  } catch (error: unknown) {
    return res.status(500).json({ success: false, error: getErrorMessage(error) || 'Failed to load chefs' });
  }
};

export const getChefProfile = async (req: Request, res: Response) => {
  try {
    const chefId = Number(req.params.id);
    if (!chefId) {
      return res.status(400).json({ success: false, error: 'Invalid chef id' });
    }

    const chef = await getChefById(chefId);
    if (!chef || !chef.isActive) {
      return res.status(404).json({ success: false, error: 'Chef not found' });
    }

    const chefDishes = await getDishesByChefId(chefId);
    const mappedDishes = chefDishes.map(mapDish);
    const rawReviews = await getReviewsByChefId(chefId);
    const visibleReviews = rawReviews.filter((review) => !review.isHidden);
    const mappedReviews = visibleReviews.map(mapReview);
    const avgRating = visibleReviews.length
      ? Math.round(
          (visibleReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / visibleReviews.length) * 10
        ) / 10
      : chef.rating || 4.6;

    return res.json({
      success: true,
      data: {
        chef: mapChef(chef, mappedDishes),
        dishes: mappedDishes,
        reviews: mappedReviews,
        avgRating,
      },
    });
  } catch (error: unknown) {
    return res.status(500).json({ success: false, error: getErrorMessage(error) || 'Failed to load chef profile' });
  }
};

export const getDishes = async (_req: Request, res: Response) => {
  try {
    const dishes = await getAllDishes();
    return res.json({ success: true, data: dishes.map(mapDish) });
  } catch (error: unknown) {
    return res.status(500).json({ success: false, error: getErrorMessage(error) || 'Failed to load dishes' });
  }
};

export const getMeals = async (_req: Request, res: Response) => {
  try {
    const dishes = await getAllDishes();
    if (dishes.length > 0) {
      return res.json({ success: true, data: dishes.map(mapMealFromDish) });
    }

    return res.json({ success: true, data: sampleMeals });
  } catch (error: unknown) {
    return res.status(500).json({ success: false, error: getErrorMessage(error) || 'Failed to load meals' });
  }
};
