function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="p-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-lg text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-600">{subtitle || "This section is being implemented."}</p>
      </div>
    </div>
  );
}

export default PlaceholderPage;
