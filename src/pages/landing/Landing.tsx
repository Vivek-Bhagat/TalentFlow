import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

import {
  Briefcase,
  Users,
  BarChart3,
  Shield,
  Star,
  Clock,
  Target,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Heart,
  Award,
  Mail,
  Phone,
  MapPin,
  Leaf,
  Menu,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    companies: 0,
    candidates: 0,
    placements: 0,
    satisfaction: 0,
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Animate statistics counter
    const animateStats = () => {
      const targets = {
        companies: 500,
        candidates: 10000,
        placements: 2500,
        satisfaction: 98,
      };
      const duration = 2000;
      const stepTime = 50;
      const steps = duration / stepTime;

      const increments = {
        companies: targets.companies / steps,
        candidates: targets.candidates / steps,
        placements: targets.placements / steps,
        satisfaction: targets.satisfaction / steps,
      };

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setStats((prev) => ({
          companies: Math.min(
            targets.companies,
            Math.round(prev.companies + increments.companies)
          ),
          candidates: Math.min(
            targets.candidates,
            Math.round(prev.candidates + increments.candidates)
          ),
          placements: Math.min(
            targets.placements,
            Math.round(prev.placements + increments.placements)
          ),
          satisfaction: Math.min(
            targets.satisfaction,
            Math.round(prev.satisfaction + increments.satisfaction)
          ),
        }));

        if (currentStep >= steps) {
          clearInterval(timer);
          setStats(targets);
        }
      }, stepTime);
    };

    setTimeout(animateStats, 1000);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to TalentFlow.",
      });
      navigate("/app/dashboard");
    }, 1000);
  };

  const handleDemoSignIn = () => {
    setIsLoading(true);

    // Simulate demo account login
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Demo Account",
        description: "Signed in with demo account. Explore TalentFlow!",
      });
      navigate("/app/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-emerald-600" />
              <span className="text-xl font-semibold text-foreground">
                <a href="/">TalentFlow</a>
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a
                href="#testimonials"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </a>
              <a
                href="#pricing"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <ThemeToggle />
              <Button
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                <a href="/signup">Get Started</a>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-3">
                <a
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                  Features
                </a>
                <a
                  href="#testimonials"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                  Testimonials
                </a>
                <a
                  href="#pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                  Pricing
                </a>
                
                <Button
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 w-full">
                  <a href="/signup">Get Started</a>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              className="space-y-6 text-center lg:text-left"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Revolutionize Your Hiring
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Find Perfect{" "}
                <span className="text-emerald-600">Talent Fast</span>
              </h1>

              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                TalentFlow streamlines your entire recruitment process with
                AI-powered matching, automated workflows, and data-driven
                insights.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button
                  onClick={handleDemoSignIn}
                  className="px-6 py-5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                  disabled={isLoading}>
                  {isLoading ? "Starting Demo..." : "Start Free Trial"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="px-6 py-5 text-sm border-border hover:bg-muted rounded-lg font-medium transition-all">
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                {[
                  { label: "Companies", value: `${stats.companies}+` },
                  {
                    label: "Candidates",
                    value: `${stats.candidates.toLocaleString()}+`,
                  },
                  { label: "Placements", value: `${stats.placements}+` },
                  { label: "Satisfaction", value: `${stats.satisfaction}%` },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right - Sign In Form */}
            <motion.div
              className="flex justify-center lg:justify-end"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}>
              <Card className="w-full max-w-md shadow-lg border bg-card">
                <CardHeader className="text-center space-y-1 pb-4">
                  <CardTitle className="text-2xl font-semibold text-foreground">
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Sign in to your TalentFlow account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm text-foreground font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 border-input focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-sm text-foreground font-medium">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 border-input focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <Button
                      onClick={handleSignIn}
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all"
                      disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-10 border-border hover:bg-muted rounded-lg text-sm transition-all"
                    onClick={handleDemoSignIn}
                    disabled={isLoading}>
                    <Users className="mr-2 h-4 w-4" />
                    Try Demo Account
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline">
                      <Link to="/signup">Signup Now</Link>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Everything you need to hire better
            </h2>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto">
              Streamline your hiring process with our comprehensive suite of
              tools
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Briefcase className="h-8 w-8 text-emerald-600" />,
                title: "Smart Job Management",
                description:
                  "Create, manage, and optimize job postings with AI-powered recommendations and multi-platform distribution.",
              },
              {
                icon: <Users className="h-8 w-8 text-emerald-600" />,
                title: "Candidate Pipeline",
                description:
                  "Track candidates through every stage with customizable pipelines and automated workflows.",
              },
              {
                icon: <BarChart3 className="h-8 w-8 text-emerald-600" />,
                title: "Advanced Analytics",
                description:
                  "Make data-driven decisions with comprehensive hiring metrics and performance insights.",
              },
              {
                icon: <Shield className="h-8 w-8 text-emerald-600" />,
                title: "Secure Assessments",
                description:
                  "Create custom assessments with anti-cheating measures and detailed performance analysis.",
              },
              {
                icon: <Clock className="h-8 w-8 text-emerald-600" />,
                title: "Interview Scheduling",
                description:
                  "Seamlessly coordinate interviews with calendar integration and automated reminders.",
              },
              {
                icon: <Target className="h-8 w-8 text-emerald-600" />,
                title: "AI Matching",
                description:
                  "Find the best candidates faster with AI-powered matching and ranking algorithms.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group p-6 hover:shadow-lg transition-all duration-300 border bg-card">
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Loved by HR teams worldwide
            </h2>
            <p className="text-base text-muted-foreground">
              See what our customers have to say
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Johnson",
                role: "Head of Talent, TechCorp",
                content:
                  "TalentFlow reduced our time-to-hire by 40% and significantly improved candidate quality. The AI matching is incredible!",
                rating: 5,
              },
              {
                name: "Michael Chen",
                role: "HR Director, StartupX",
                content:
                  "The assessment platform helped us identify top performers before interviews. Our hiring success rate went from 70% to 95%.",
                rating: 5,
              },
              {
                name: "Emily Rodriguez",
                role: "Recruiter, GlobalTech",
                content:
                  "Finally, a platform that understands recruitment workflows. The automation features saved us 20 hours per week.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="p-6 bg-card border hover:shadow-lg transition-all">
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-base text-muted-foreground">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$29",
                period: "per month",
                description: "Perfect for small teams",
                features: [
                  "Up to 10 job postings",
                  "Basic candidate tracking",
                  "Email support",
                  "Standard templates",
                ],
                popular: false,
              },
              {
                name: "Professional",
                price: "$99",
                period: "per month",
                description: "Best for growing companies",
                features: [
                  "Unlimited job postings",
                  "Advanced analytics",
                  "Custom assessments",
                  "Priority support",
                  "API access",
                ],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "contact us",
                description: "For large organizations",
                features: [
                  "Everything in Professional",
                  "Custom integrations",
                  "Dedicated success manager",
                  "SLA guarantees",
                  "Advanced security",
                ],
                popular: false,
              },
            ].map((plan, index) => (
              <Card
                key={index}
                className={`relative p-6 text-center border ${
                  plan.popular
                    ? "bg-card shadow-xl md:scale-105 ring-2 ring-emerald-600"
                    : "bg-card shadow-md hover:shadow-lg"
                } transition-all`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-2 mb-6 text-left">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                    plan.popular
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}>
                  {plan.price === "Custom"
                    ? "Contact Sales"
                    : "Start Free Trial"}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-emerald-600" />
                <span className="text-lg font-semibold text-foreground">
                  TalentFlow
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The modern recruitment platform that helps you find and hire the
                best talent faster.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0">
                  <Globe className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0">
                  <Award className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">
                Product
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors">
                    API Docs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">
                Support
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <a
                    href="mailto:support@talentflow.com"
                    className="hover:text-foreground transition-colors">
                    support@talentflow.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <a
                    href="tel:+1234567890"
                    className="hover:text-foreground transition-colors">
                    +1 (234) 567-890
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>San Francisco, CA</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>
              &copy; 2025 TalentFlow. All rights reserved. Built with ❤️ for
              modern recruiters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
