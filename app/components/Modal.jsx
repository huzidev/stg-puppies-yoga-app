import { useActionData, useSubmit } from "@remix-run/react";
import {
  BlockStack,
  Box,
  Button,
  InlineStack,
  Modal,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

export function MyModal({
  isModalOpen,
  setModalOpen,
  ticketId,
  fullName,
  setFullName,
  setPhone,
  phone,
  setWaiverSigned,
  signUrl,
  setSignUrl,
  isShowAgreement,
  setLoading,
  loading,
}) {
  const date = new Date();
  const [signature, setSignature] = useState(null);
  const actionData = useActionData();
  const submit = useSubmit();

  function clearSignature() {
    if (signature) {
      signature.clear();
      setSignature(null);
    }
  }

  function handleModalClose() {
    setModalOpen(false);
    setFullName("");
    setPhone("");
    clearSignature();
  }

  function handleSubmit() {
    setSignUrl(signature.getTrimmedCanvas().toDataURL("image/png"));
  }

  useEffect(() => {
    if (signUrl && isModalOpen && !isShowAgreement) {
      setLoading({
        state: true,
        type: "waiver",
      });
      setWaiverSigned(true);
      submit(
        {
          fullName,
          phone,
          signUrl,
          ticketId,
          action: "submit-agreement",
        },
        { method: "post", encType: "multipart/form-data", replace: true },
      );
    }
  }, [signUrl]);

  useEffect(() => {
    // if agreement is saved successfully then status will be 200
    if (actionData?.status === 200 && signUrl && !isShowAgreement) {
      setLoading({
        state: false,
        type: "",
      });
      handleModalClose();
      shopify.toast.show(actionData.messsage);
    }
  }, [actionData]);

  const message = "Please sign the agreement below:";
  const { state, type } = loading;

  return (
    <Modal
      open={isModalOpen}
      onClose={handleModalClose}
      title="Agreement"
      primaryAction={
        !isShowAgreement
          ? {
              content: "Submit Agreement",
              onAction: handleSubmit,
              loading: state && type === "waiver",
              disabled: !fullName || (state && type === "waiver"),
            }
          : ""
      }
      secondaryActions={[
        {
          content: isShowAgreement ? "Close" : "Cancel",
          onAction: handleModalClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            Waiver and Release of Liability
          </Text>
          <Text as="h3" variant="headingSm">
            1. Assumption of Risk:
          </Text>
          <Text as="p" variant="bodyMd">
            I acknowledge that participation in the Puppies & Yoga event
            organized by AEY PHV (Puppies & Yoga) involves inherent risks,
            including but not limited to physical injury from yoga practice,
            interactions with live animals (dogs), potential allergic reactions,
            and other hazards. I voluntarily assume full responsibility for any
            risks, injuries, or damages that may occur, whether related to the
            animals, other participants, or the environment. This assumption of
            risk extends to any minors I am supervising at this event. If I am
            accompanying a minor, I understand that I am required to sign a
            separate waiver on behalf of that minor, acknowledging and accepting
            the same terms and conditions as outlined herein.
          </Text>
          <Text as="h3" variant="headingSm">
            2. Indemnification and Release:
          </Text>
          <Text as="p" variant="bodyMd">
            In consideration of being allowed to participate in this event, I
            agree to waive, release, and discharge AEY PHV (Puppies & Yoga), its
            organizers, event facilities, employees, and agents from any and all
            liability, claims, demands, actions, or causes of action whatsoever
            arising out of or related to any loss, damage, or injury, including
            death, that may be sustained by me or any property belonging to me,
            whether caused by the negligence of the releasees or otherwise. This
            release applies to me, my heirs, executors, and administrators. I
            agree not to sue AEY PHV (Puppies & Yoga) or any of the
            aforementioned parties for any losses, damages, expenses, or fees
            that arise out of or result from my attendance at the event.
          </Text>
          <Text as="h3" variant="headingSm">
            3. Safety Risks Involving Live Animals:
          </Text>
          <Text as="p" variant="bodyMd">
            I understand and accept the risks associated with the presence of
            live animals (dogs) at the event, including but not limited to the
            possibility of scratching, biting, or other injuries. I agree to
            interact with the animals in a gentle and responsible manner and to
            follow any instructions provided by the organizers or staff. I
            acknowledge that AEY PHV (Puppies & Yoga) cannot control the
            behavior of the animals and that I am responsible for my own safety
            and the safety of any minors I am supervising.
          </Text>
          <Text as="h3" variant="headingSm">
            4. Health and Medical Conditions:
          </Text>
          <Text as="p" variant="bodyMd">
            I confirm that I am physically fit and have no medical condition
            that would prevent my participation in this event. I understand that
            yoga and interaction with animals may require physical exertion and
            may not be suitable for everyone. I have consulted with a physician
            if necessary before participating.
          </Text>
          <Text as="h3" variant="headingSm">
            5. Photo/Video Release:
          </Text>
          <Text as="p" variant="bodyMd">
            I hereby consent to and authorize AEY PHV (Puppies & Yoga) to use
            any photographs and/or videos taken of me during the event for
            promotional purposes, without compensation. I waive any claims for
            invasion of privacy, defamation, or any other claims based on the
            use of my likeness. All images and digital files are owned by AEY
            PHV (Puppies & Yoga).
          </Text>

          <Text as="h3" variant="headingSm">
            6. Governing Law:
          </Text>
          <Text as="p" variant="bodyMd">
            This waiver and release of liability shall be governed by and
            construed in accordance with the laws of the state/province of the
            studio in which you are attending the class, without regard to its
            conflict of laws principles.
          </Text>

          <Text as="h3" variant="headingSm">
            7. Acknowledgment of Understanding:
          </Text>
          <Text as="p" variant="bodyMd">
            I have read this waiver and release of liability, fully understand
            its terms, and understand that I am giving up substantial rights,
            including my right to sue. I acknowledge that I am signing this
            agreement freely and voluntarily, and intend by my signature to be a
            complete and unconditional release of all liability to the greatest
            extent allowed by law.
          </Text>
        </BlockStack>
        <br />
        {isShowAgreement ? (
          <>
            <InlineStack blockAlign="center" align="space-between">
              <BlockStack gap="300">
                <TextField
                  value={fullName}
                  onChange={(value) => setFullName(value)}
                  autoComplete="off"
                  disabled
                />
              </BlockStack>
              <BlockStack gap="300">
                <TextField
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  autoComplete="off"
                  disabled
                />
              </BlockStack>
              <BlockStack>
                <Thumbnail
                  style={{ boxShadow: "none" }}
                  size="large"
                  source={signUrl}
                  alt="Signature"
                />
              </BlockStack>
            </InlineStack>
            <InlineStack align="space-between">
              <Text variant="headingMd" as="p">
                Full Name
              </Text>
              <Text variant="headingMd" as="p">
                Contact
              </Text>
              <Text variant="headingMd" as="p">
                Signature
              </Text>
            </InlineStack>
          </>
        ) : (
          <>
            <TextField
              label="Full Name"
              value={fullName}
              onChange={(value) => setFullName(value)}
              autoComplete="off"
            />
            <Box paddingBlock="300">
              <TextField
                label="Phone Number"
                value={phone}
                onChange={(value) => setPhone(value)}
                autoComplete="off"
              />
            </Box>
            <Text as="p" variant="bodyMd">
              {message}
            </Text>
            <Box paddingBlock="300">
              <SignatureCanvas
                penColor="black"
                canvasProps={{
                  border: "black",
                  style: { border: "1px solid black", width: "100%" },
                  height: 200,
                  className: "sigCanvas",
                }}
                ref={(ref) => setSignature(ref)}
              />
            </Box>
            <Button onClick={clearSignature}>Clear Signature</Button>
            <Box paddingBlockStart="300">{date.toLocaleDateString()}</Box>
          </>
        )}
      </Modal.Section>
    </Modal>
  );
}
