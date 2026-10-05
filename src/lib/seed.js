import { CometChat, DEMO_USERS } from './cometchat';

export async function seedDemoIncidents(currentUser) {
  if (!currentUser) return;
  const companyId = currentUser.companyId;

  console.log(`[RescueRoom Seed] Generating sample operational incidents for ${currentUser.companyName}...`);

  const demoScenarios = [
    {
      code: '8821',
      equipment: companyId === 'kestrel' ? 'Freightliner FL-90' : 'Excavator EX-204',
      severity: 'CRITICAL',
      desc: 'Hydraulic main boom rupture. High pressure line ruptured near swing motor. Immediate stoppage.',
      openedMinsAgo: 24,
      status: 'open',
    },
    {
      code: '7412',
      equipment: companyId === 'kestrel' ? 'Telehandler TH-44' : 'Bulldozer BD-801',
      severity: 'SERIOUS',
      desc: 'Track tension cylinder pressure drop under heavy blade load. 50% capacity loss.',
      openedMinsAgo: 52,
      status: 'open',
    },
    {
      code: '6109',
      equipment: companyId === 'kestrel' ? 'Electric Forklift EF-12' : 'Haul Truck HT-310',
      severity: 'MINOR',
      desc: 'Rear auxiliary alternator warning light flickering during cycle dump.',
      openedMinsAgo: 110,
      status: 'open',
    },
    {
      code: '5204',
      equipment: companyId === 'kestrel' ? 'Cargo Van CV-08' : 'Wheel Loader WL-550',
      severity: 'SERIOUS',
      desc: 'Bucket hydraulic cylinder seal replacement completed. Pressure verified.',
      openedMinsAgo: 180,
      status: 'resolved',
      resolvedMinsAgo: 45,
    },
  ];

  for (const s of demoScenarios) {
    const rawGuid = `${companyId}_inc_${s.code}`;
    const groupName = `INC-${s.code} · ${s.equipment}`;

    try {
      // Check if group already exists
      try {
        await CometChat.getGroup(rawGuid);
        console.log(`[RescueRoom Seed] Group ${rawGuid} already exists, skipping creation.`);
        continue;
      } catch {
        // Group does not exist, create it
      }

      const openedAt = Date.now() - s.openedMinsAgo * 60 * 1000;
      const group = new CometChat.Group(rawGuid, groupName, CometChat.GROUP_TYPE.PUBLIC);
      const meta = {
        incidentNum: `INC-${s.code}`,
        equipment: s.equipment,
        severity: s.severity,
        companyId,
        companyName: currentUser.companyName,
        operatorUid: currentUser.uid,
        operatorName: currentUser.name,
        operatorCallsign: currentUser.callsign,
        description: s.desc,
        openedAt,
        status: s.status,
      };

      if (s.status === 'resolved') {
        meta.resolvedAt = Date.now() - s.resolvedMinsAgo * 60 * 1000;
        meta.resolvedBy = companyId === 'kestrel' ? 'SANA-TECH' : 'TECH-NORTH-09';
        meta.resolvedByName = companyId === 'kestrel' ? 'Sana Sheikh' : 'Ravi Kumar';
      }

      group.setMetadata(meta);
      await CometChat.createGroup(group);

      // Add responders
      const otherResponders = DEMO_USERS.filter(
        (u) => u.companyId === companyId && u.uid !== currentUser.uid
      );
      const membersList = otherResponders.map(
        (u) => new CometChat.GroupMember(u.uid, CometChat.GROUP_MEMBER_SCOPE.ADMIN)
      );
      if (membersList.length > 0) {
        await CometChat.addMembersToGroup(rawGuid, membersList, []);
      }

      // Initial dispatch message
      const initialText =
        `🚨 EMERGENCY DISPATCH · INCIDENT REPORT\n` +
        `----------------------------------------\n` +
        `INCIDENT ID: INC-${s.code}\n` +
        `EQUIPMENT: ${s.equipment}\n` +
        `SEVERITY: ${s.severity}\n` +
        `REPORTED BY: ${currentUser.name.toUpperCase()} (${currentUser.callsign})\n` +
        `FAULT DETAILS: ${s.desc}\n` +
        `----------------------------------------\n` +
        `STAND BY FOR FIELD ROSTER ACKNOWLEDGEMENT.`;

      const msg = new CometChat.TextMessage(rawGuid, initialText, CometChat.RECEIVER_TYPE.GROUP);
      await CometChat.sendMessage(msg);

      if (s.status === 'resolved') {
        const resolveMsg = new CometChat.TextMessage(
          rawGuid,
          `✅ [INCIDENT OFFICIALLY RESOLVED]\nRESOLVED BY: ${meta.resolvedByName.toUpperCase()} (${meta.resolvedBy})\nSTATUS: WORK ORDER COMPLETED · ALL ROSTER UNITS STAND DOWN`,
          CometChat.RECEIVER_TYPE.GROUP
        );
        await CometChat.sendMessage(resolveMsg);
        localStorage.setItem(`rescueroom_resolved_${rawGuid}`, JSON.stringify(meta));
      }

      console.log(`[RescueRoom Seed] Successfully seeded ${groupName}`);
    } catch (scenarioErr) {
      console.warn(`[RescueRoom Seed] Notice on scenario ${rawGuid}:`, scenarioErr);
    }
  }

  console.log('[RescueRoom Seed] Demo scenario seeding complete.');
}
