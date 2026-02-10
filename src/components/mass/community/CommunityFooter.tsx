import yanguLogo from "@/assets/yangu-logo-community.png";

export function CommunityFooter() {
  return (
    <footer className="w-full px-6 py-10" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        <img src={yanguLogo} alt="Yangu" className="h-12 w-auto opacity-60" />
        <div className="flex gap-6">
          <a href="#" className="text-[12px] text-gray-400 hover:text-gray-600">
            Terms of service
          </a>
          <a href="#" className="text-[12px] text-gray-400 hover:text-gray-600">
            Privacy policy
          </a>
        </div>
      </div>
    </footer>
  );
}
