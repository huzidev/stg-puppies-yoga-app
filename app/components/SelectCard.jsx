import {
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Select,
  Text
} from "@shopify/polaris";

export default function SelectCard({
  locations,
  setSelectedLocation,
  selectedLocation,
  selectedStudio,
  setSelectedStudio,
  setStep,
}) {
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    
    setSelectedStudio(location.studios[0]);
  };

  const handleStudioSelect = (studioId) => {
    console.log("SW what is studio ID", studioId);

    const studio = selectedLocation.studios.find(
      (s) => String(s.id) === String(studioId),
    );

    console.log("SW what is studio in function", studio);

    setSelectedStudio(studio);
  };

  return (
    <BlockStack gap="600">
      {!selectedLocation ? (
        <InlineStack wrap gap="400">
          {locations?.map((location) => (
            <Box width="30%" key={location.id}>
              <Card padding="600" sectioned>
                <BlockStack inlineAlign="center" gap="300" align="center">
                  <Text variant="headingMd">{location.name}</Text>
                  <Box width="30%">
                    <Button
                      onClick={() => handleLocationSelect(location)}
                      variant={
                        selectedLocation?.id === location.id
                          ? "primary"
                          : "secondary"
                      }
                      fullWidth
                    >
                      {selectedLocation?.id === location.id
                        ? "Selected"
                        : "Select"}
                    </Button>
                  </Box>
                </BlockStack>
              </Card>
            </Box>
          ))}
        </InlineStack>
      ) : (
        <InlineStack width="100%" gap="400">
          <Box width="20%">
            <Select
              width="100%"
              options={selectedLocation.studios.map((studio) => ({
                label: studio.title,
                value: String(studio.id),
              }))}
              onChange={handleStudioSelect}
              value={String(selectedStudio?.id)}
            />
          </Box>

          <Box onClick={() => setStep(1)} width="5%">
            <Button
              tone="success"
              variant="secondary"
              disabled={!selectedStudio}
              onClick={() => setStep(1)}
              fullWidth
            >
              Proceed
            </Button>
          </Box>
        </InlineStack>
      )}
    </BlockStack>
  );
}
