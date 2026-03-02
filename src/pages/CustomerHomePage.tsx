import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChefHat, Star, Clock, UtensilsCrossed, SearchX } from 'lucide-react';
import { fetchChefsWithPreview, type ChefPreview } from '@/services/apiClient';

const CustomerHomePage = () => {
  const navigate = useNavigate();
  const [chefs, setChefs] = useState<ChefPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChefs();
  }, []);

  const loadChefs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChefsWithPreview();
      setChefs(data.chefs);
    } catch (err: any) {
      setError(err.message || 'Failed to load chefs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout title="Explore Home Chefs" subtitle="Fresh, home-cooked meals delivered to your door">
      {/* Loading */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="h-32 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-medium mb-2">{error}</p>
            <Button variant="outline" onClick={loadChefs}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && chefs.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <SearchX className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">No chefs available in your area</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're expanding rapidly. Check back soon or update your pincode in profile settings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chef Grid */}
      {!loading && !error && chefs.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chefs.map((chef) => (
            <Card
              key={chef.chefId}
              className="shadow-card hover:shadow-elevated transition-all cursor-pointer group overflow-hidden"
              onClick={() => navigate(`/customer/chef/${chef.chefId}`)}
            >
              <div className="h-28 bg-gradient-to-br from-chef/20 to-primary/10 flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-chef flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <ChefHat className="w-8 h-8 text-chef-foreground" />
                </div>
              </div>

              <CardContent className="p-5">
                <h3 className="font-display font-bold text-lg mb-1">{chef.kitchenName}</h3>

                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    {chef.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {chef.deliveryWindow}
                  </span>
                </div>

                {chef.dishesPreview.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {chef.dishesPreview.slice(0, 3).map((d) => (
                      <Badge key={d.planId} variant="secondary" className="text-xs font-normal">
                        <UtensilsCrossed className="w-3 h-3 mr-1" />
                        {d.planName}
                      </Badge>
                    ))}
                    {chef.dishesPreview.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{chef.dishesPreview.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    Starts from{' '}
                    <span className="font-bold text-primary">
                      ₹{Math.round(chef.startingPrice / 100)}/mo
                    </span>
                  </p>
                  <Button size="sm" className="gradient-primary">
                    View Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
};

export default CustomerHomePage;
