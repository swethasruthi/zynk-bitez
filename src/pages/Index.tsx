import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UtensilsCrossed, 
  Clock, 
  Leaf, 
  ChefHat, 
  Truck, 
  Calendar,
  ArrowRight,
  CheckCircle2,
  Heart,
  Flame,
  Star,
  Sparkles
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Flame,
      title: 'CRAFTED WITH PRECISION',
      description: 'Every dish prepared with professional expertise and care',
    },
    {
      icon: Clock,
      title: 'FLEXIBLE SERVICE',
      description: 'Modify or skip meals before the evening cutoff',
    },
    {
      icon: Star,
      title: 'PREMIUM INGREDIENTS',
      description: 'Sourced daily from trusted local suppliers',
    },
    {
      icon: Calendar,
      title: 'CURATED MENUS',
      description: 'Chef-designed variety that inspires',
    },
  ];

  const plans = [
    { name: 'ESSENTIALS', price: 'â‚¹2,999', meals: '20 meals/month', popular: false },
    { name: 'SIGNATURE', price: 'â‚¹4,499', meals: '30 meals/month', popular: true },
    { name: 'COMPLETE', price: 'â‚¹5,999', meals: '60 meals/month', popular: false },
  ];

  return (
    <Layout>
      {/* Hero Section - Light Kitchen Style with Green Accents */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center" style={{ background: 'linear-gradient(-45deg, #ffffff, #f0fdf4, #ffffff, #ecfdf5)', backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Particles */}
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-30 animate-float" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)' }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-20 animate-float-slow" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 60%)', animation: 'pulseSoft 4s ease-in-out infinite' }} />
          
          {/* Animated Grid */}
          <div className="absolute inset-0 opacity-40" style={{ 
            backgroundImage: 'linear-gradient(rgba(34,197,94,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            animation: 'gridMove 20s linear infinite'
          }} />
          
          {/* Decorative Kitchen Elements */}
          <div className="absolute top-10 right-20 opacity-20 animate-float-delayed">
            <UtensilsCrossed className="w-24 h-24 text-green-500" />
          </div>
          <div className="absolute bottom-20 left-20 opacity-15 animate-float">
            <ChefHat className="w-20 h-20 text-green-600" />
          </div>
          <div className="absolute top-1/3 right-1/4 opacity-10 animate-spin-slow">
            <Sparkles className="w-16 h-16 text-green-500" />
          </div>
        </div>

        <div className="container px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge with glow effect */}
            <div className="inline-flex items-center gap-3 px-6 py-3 border border-green-300 text-sm font-chef tracking-widest mb-8 animate-slide-down bg-white/70 backdrop-blur-sm rounded-full" style={{ boxShadow: '0 0 30px rgba(34,197,94,0.2)' }}>
              <ChefHat className="w-5 h-5 text-green-500 animate-pulse-soft" />
              <span className="text-green-700">THE MODERN KITCHEN</span>
            </div>
            
            {/* Main Heading with stagger animation */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 animate-slide-up">
              <span className="text-gray-800 block">Kitchen to Doorstep</span>
              <span className="block mt-4 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 bg-clip-text text-transparent animate-pulse-soft">Delivered to You</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-light animate-fade-in animate-delay-300">
              Premium meals crafted by professional home chefs. 
              <span className="text-gray-800 font-medium"> Restaurant-quality dining</span> in the comfort of your home.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center animate-slide-up animate-delay-400">
              <Button asChild size="lg" className="group relative overflow-hidden px-10 py-7 text-base font-chef tracking-wider rounded-full text-white" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', boxShadow: '0 10px 40px rgba(34,197,94,0.4)' }}>
                <Link to="/register">
                  <span className="relative z-10 flex items-center">
                    GET STARTED
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
              <Button asChild size="lg" className="px-10 py-7 font-chef tracking-wider text-sm rounded-full backdrop-blur-sm transition-all hover:shadow-lg hover:bg-green-50" style={{ background: 'white', border: '2px solid #22c55e', color: '#16a34a' }}>
                <Link to="/weekly-menu" style={{ color: '#16a34a' }}>EXPLORE MENU</Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in animate-delay-500">
              {[
                { value: '50+', label: 'CHEFS' },
                { value: '1000+', label: 'MEALS DAILY' },
                { value: '4.9â˜…', label: 'RATING' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-green-600 mb-1">{stat.value}</p>
                  <p className="font-chef text-[10px] tracking-widest text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom accent line with animation */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #22c55e, transparent)', animation: 'shimmer 3s infinite' }} />
      </section>

      {/* Features - Steel Panel Style with animations */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #e5e5e5 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="container px-4 relative z-10">
          <div className="text-center mb-16 animate-slide-up">
            <p className="font-chef text-xs tracking-widest text-green-600 mb-4">WHY CHOOSE US</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-gray-900">The ZYNK Difference</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group bg-white border border-gray-200 rounded-lg hover-lift animate-slide-up overflow-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="pt-10 pb-8 relative">
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-lg bg-gray-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                      <feature.icon className="w-7 h-7 text-green-500 group-hover:animate-pulse" />
                    </div>
                    <h3 className="font-chef text-sm tracking-wider font-semibold mb-3 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works - Animated Steps */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, white 0%, #f8f8f8 100%)' }}>
        <div className="container px-4">
          <div className="text-center mb-20 animate-slide-up">
            <p className="font-chef text-xs tracking-widest text-green-600 mb-4">THE PROCESS</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-gray-900">How It Works</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-transparent via-gray-900 to-transparent mx-auto" />
          </div>
          
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-green-300 to-transparent" style={{ transform: 'translateY(40px)' }} />
          
          <div className="grid md:grid-cols-3 gap-16 max-w-5xl mx-auto relative">
            {[
              { step: '01', title: 'SELECT YOUR PLAN', desc: 'Choose a subscription that matches your lifestyle and appetite', icon: Star },
              { step: '02', title: 'MEET YOUR CHEF', desc: 'Browse curated profiles and select your personal culinary artist', icon: ChefHat },
              { step: '03', title: 'SAVOR DAILY', desc: 'Fresh, restaurant-quality meals delivered to your doorstep', icon: Flame },
            ].map((item, index) => (
              <div key={index} className="text-center group animate-slide-up" style={{ animationDelay: `${index * 200}ms` }}>
                <div className="relative mb-8">
                  {/* Large background number */}
                  <span className="text-[120px] font-display font-bold text-gray-100 select-none leading-none">{item.step}</span>
                  {/* Floating icon box */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-20 h-20 rounded-lg bg-gray-900 flex items-center justify-center group-hover:scale-110 transition-all duration-500" style={{ boxShadow: '0 15px 40px rgba(0,0,0,0.15)' }}>
                      <item.icon className="w-9 h-9 text-green-500" />
                    </div>
                  </div>
                </div>
                <h3 className="font-chef text-sm tracking-wider font-bold mb-4 text-gray-900 group-hover:text-green-600 transition-colors">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Animated Cards */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(-45deg, #ffffff, #f0fdf4, #ffffff, #ecfdf5)', backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}>
        {/* Animated particles */}
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full opacity-30 animate-float" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full opacity-20 animate-float-slow" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)' }} />
        
        <div className="container px-4 relative z-10">
          <div className="text-center mb-20 animate-slide-up">
            <p className="font-chef text-xs tracking-widest text-green-600 mb-4">PRICING</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-gray-800">Choose Your Plan</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`group relative overflow-hidden transition-all duration-500 animate-slide-up ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 border-0 md:scale-110 z-10' 
                    : 'bg-white border border-gray-200 hover:border-green-300 hover:shadow-lg'
                }`}
                style={{ 
                  animationDelay: `${index * 150}ms`,
                  boxShadow: plan.popular ? '0 25px 60px rgba(34,197,94,0.4)' : '0 10px 40px rgba(0,0,0,0.08)'
                }}
              >
                {plan.popular && (
                  <>
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }} />
                  </>
                )}
                <CardContent className="pt-12 pb-10 text-center relative">
                  <p className={`font-chef text-xs tracking-widest mb-6 ${plan.popular ? 'text-green-100' : 'text-gray-500'}`}>
                    {plan.popular && 'â˜… '}{plan.name}{plan.popular && ' â˜…'}
                  </p>
                  <p className={`text-6xl font-display font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-800'}`}>
                    {plan.price}
                  </p>
                  <p className={`text-sm mb-10 ${plan.popular ? 'text-green-100' : 'text-gray-500'}`}>{plan.meals}</p>
                  <ul className={`space-y-4 text-sm text-left mb-10 ${plan.popular ? 'text-white' : 'text-gray-600'}`}>
                    {['Chef-crafted meals', 'Modify before 7 PM', 'Complimentary delivery', 'Choose your chef'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-green-500'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild 
                    className={`w-full font-chef tracking-wider text-sm py-6 transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-white text-green-600 hover:bg-green-50 shadow-lg' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <Link to="/register">SELECT PLAN</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Roles - Animated Cards */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #e5e5e5 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="container px-4 relative z-10">
          <div className="text-center mb-20 animate-slide-up">
            <p className="font-chef text-xs tracking-widest text-green-600 mb-4">CAREERS</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-gray-900">Join Our Team</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-transparent via-gray-900 to-transparent mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {[
              { icon: ChefHat, label: 'HOME CHEF', title: 'Cook from Home', desc: 'Transform your kitchen into a professional venture. Share your culinary expertise and build your reputation.', link: '/register', btn: 'APPLY NOW' },
              { icon: Truck, label: 'DELIVERY PARTNER', title: 'Deliver Excellence', desc: 'Be the crucial link in our culinary chain. Flexible schedules and competitive compensation.', link: '/register', btn: 'JOIN TEAM' },
            ].map((item, index) => (
              <Card key={index} className="group bg-white border border-gray-200 rounded-xl hover-lift animate-slide-up overflow-hidden" style={{ animationDelay: `${index * 200}ms` }}>
                <CardContent className="pt-10 pb-8 relative">
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-xl bg-gray-900 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500" style={{ boxShadow: '0 15px 40px rgba(0,0,0,0.1)' }}>
                      <item.icon className="w-10 h-10 text-green-500" />
                    </div>
                    <p className="font-chef text-xs tracking-widest text-green-600 mb-3">{item.label}</p>
                    <h3 className="font-display font-bold text-2xl mb-4 text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">{item.desc}</p>
                    <Button asChild className="font-chef tracking-wider text-sm py-5 px-8 bg-gray-900 hover:bg-gray-800 text-white transition-all hover:shadow-lg">
                      <Link to={item.link}>{item.btn}</Link>
                    </Button>
                  </div>
                  
                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Animated Banner */}
      <section className="py-28 relative overflow-hidden" style={{ background: 'linear-gradient(-45deg, #1a1a1a, #252525, #1a1a1a, #2d2d2d)', backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 animate-float" style={{ background: 'radial-gradient(circle, rgba(184,115,51,0.5) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-15 animate-float-slow" style={{ background: 'radial-gradient(circle, rgba(184,115,51,0.4) 0%, transparent 70%)' }} />
          
          {/* Decorative icons */}
          <UtensilsCrossed className="absolute top-10 left-10 w-16 h-16 text-green-500/10 animate-float" />
          <ChefHat className="absolute bottom-10 right-10 w-20 h-20 text-white/5 animate-float-delayed" />
          <Sparkles className="absolute top-1/2 right-20 w-12 h-12 text-green-500/10 animate-pulse-soft" />
        </div>
        
        <div className="container px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <p className="font-chef text-xs tracking-widest text-green-500 mb-6">READY TO BEGIN?</p>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-8" style={{ textShadow: '0 0 80px rgba(255,255,255,0.1)' }}>
              Experience Culinary Excellence
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent mx-auto mb-10" style={{ animation: 'shimmer 2s infinite' }} />
            <p className="text-gray-400 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
              Join thousands who have elevated their daily dining experience with our chef-crafted meals.
            </p>
            <Button asChild size="lg" className="group relative overflow-hidden px-12 py-8 text-base font-chef tracking-wider rounded-sm" style={{ background: 'linear-gradient(135deg, #b87333 0%, #8b5a2b 100%)', boxShadow: '0 15px 50px rgba(184,115,51,0.5)' }}>
              <Link to="/register">
                <span className="relative z-10 flex items-center">
                  START YOUR SUBSCRIPTION
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

