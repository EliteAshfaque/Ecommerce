import { Truck, Shield, Headphones, CreditCard } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free shipping on orders over $50 worldwide",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% secure payment with SSL encryption",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round-the-clock customer support assistance",
  },
  {
    icon: CreditCard,
    title: "Easy Returns",
    description: "30-day hassle-free return policy",
  },
];

const FeatureSection = () => {
  return (
    <section className="py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="glass-card animate-smooth glow-on-hover rounded-3xl p-7 text-center"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div className="gradient-primary mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
              <feature.icon className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {feature.title}
            </h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;
